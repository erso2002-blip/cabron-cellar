import { randomUUID } from "node:crypto";
import crypto from "node:crypto";
import { Router } from "express";
import { pool } from "@workspace/db";
import { getAuthenticatedUser } from "../lib/auth.js";
import { ensureBillingSchema } from "../lib/billingSchema.js";
import { billingPlans, getBillingPlan } from "../lib/billingPlans.js";
import { activeMarket } from "../lib/markets.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const router = Router();

type MercadoPagoPreapprovalResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  status?: string;
  message?: string;
  error?: string;
};

type MercadoPagoWebhookBody = {
  id?: string | number;
  live_mode?: boolean;
  type?: string;
  topic?: string;
  action?: string;
  data?: {
    id?: string | number;
  };
};

type MercadoPagoPreapprovalDetails = {
  id?: string;
  status?: string;
  external_reference?: string;
  payer_email?: string;
  reason?: string;
  init_point?: string;
  sandbox_init_point?: string;
  live_mode?: boolean;
  next_payment_date?: string;
  date_created?: string;
  last_modified?: string;
  auto_recurring?: {
    currency_id?: string;
    transaction_amount?: number | string;
  };
};

function getPublicAppUrl(req: any) {
  const configuredUrl =
    process.env.MYCELLAR_PUBLIC_URL ??
    process.env.APP_PUBLIC_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (configuredUrl) {
    return configuredUrl.startsWith("http") ? configuredUrl : `https://${configuredUrl}`;
  }

  const protocol = req.headers["x-forwarded-proto"] ?? req.protocol ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  return `${protocol}://${host}`;
}

function getAutoRecurring(plan: NonNullable<ReturnType<typeof getBillingPlan>>) {
  if (plan.interval === "monthly") {
    return {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: plan.amount,
      currency_id: plan.currency,
    };
  }

  if (plan.interval === "annual") {
    return {
      frequency: 12,
      frequency_type: "months",
      transaction_amount: plan.amount,
      currency_id: plan.currency,
    };
  }

  return null;
}

function getDataId(req: any, body: MercadoPagoWebhookBody) {
  return String(
    req.query?.["data.id"] ??
      req.query?.id ??
      body.data?.id ??
      body.id ??
      "",
  ).trim();
}

function verifyWebhookSignature(req: any, dataId: string) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return true;

  const xSignature = String(req.headers["x-signature"] ?? "");
  const xRequestId = String(req.headers["x-request-id"] ?? "");
  const ts = xSignature.match(/(?:^|,)ts=([^,]+)/)?.[1];
  const expected = xSignature.match(/(?:^|,)v1=([^,]+)/)?.[1];
  if (!ts || !expected || !xRequestId || !dataId) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const signature = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  if (signature.length !== expected.length) return false;

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function normalizeSubscriptionStatus(providerStatus: string | undefined) {
  switch ((providerStatus ?? "").toLowerCase()) {
    case "authorized":
      return "active";
    case "cancelled":
    case "canceled":
      return "canceled";
    case "paused":
      return "paused";
    case "pending":
      return "pending";
    default:
      return "unknown";
  }
}

function parseProviderDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function fetchMercadoPagoPreapproval(id: string) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Mercado Pago is not configured");

  const response = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(id)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = (await response.json().catch(() => ({}))) as MercadoPagoPreapprovalDetails;
  if (!response.ok) {
    const error = new Error("Could not fetch Mercado Pago subscription");
    (error as Error & { statusCode?: number }).statusCode = response.status;
    throw error;
  }

  return data;
}

async function upsertSubscriptionFromProvider(data: MercadoPagoPreapprovalDetails) {
  if (!data.id) return null;

  const status = normalizeSubscriptionStatus(data.status);
  const nextPaymentAt = parseProviderDate(data.next_payment_date);
  const startedAt = parseProviderDate(data.date_created);
  const canceledAt = status === "canceled" ? parseProviderDate(data.last_modified) ?? new Date() : null;

  const result = await pool.query(
    `
      UPDATE billing_subscriptions
      SET
        user_email = COALESCE($2, user_email),
        status = $3,
        provider_status = $4,
        checkout_url = COALESCE($5, checkout_url),
        sandbox_checkout_url = COALESCE($6, sandbox_checkout_url),
        live_mode = COALESCE($7, live_mode),
        raw_payload = $8::jsonb,
        started_at = COALESCE($9, started_at),
        next_payment_at = $10,
        canceled_at = $11,
        updated_at = now()
      WHERE provider_subscription_id = $1
      RETURNING *
    `,
    [
      data.id,
      data.payer_email ?? null,
      status,
      data.status ?? null,
      data.init_point ?? null,
      data.sandbox_init_point ?? null,
      data.live_mode ?? null,
      JSON.stringify(data),
      startedAt,
      nextPaymentAt,
      canceledAt,
    ],
  );

  return result.rows[0] ?? null;
}

router.get("/billing/plans", (_req: any, res: any) => {
  res.json({
    plans: billingPlans,
    market: activeMarket,
    provider: {
      name: "Mercado Pago",
      configured: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN),
    },
  });
});

router.get("/billing/status", async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  await ensureBillingSchema();
  const result = await pool.query(
    `
      SELECT plan_id, status, provider_status, provider_subscription_id, next_payment_at, updated_at
      FROM billing_subscriptions
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    [user.id],
  );

  const subscription = result.rows[0] ?? null;
  return res.json({
    plan: subscription?.status === "active" ? subscription.plan_id : "free",
    pro: subscription?.status === "active",
    subscription,
  });
});

router.post(
  "/billing/checkout",
  rateLimit({ keyPrefix: "billing-checkout", windowMs: 60_000, max: 6 }),
  async (req: any, res: any) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const plan = getBillingPlan(req.body?.planId);
    if (!plan) return res.status(400).json({ error: "Invalid billing plan" });
    if (plan.id === "free") {
      return res.status(400).json({ error: "Free plan does not require checkout" });
    }
    if (!user.email) {
      return res.status(400).json({ error: "User email is required for subscription checkout" });
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(503).json({ error: "Mercado Pago is not configured" });
    }

    const autoRecurring = getAutoRecurring(plan);
    if (!autoRecurring) return res.status(400).json({ error: "Invalid recurring plan" });

    const baseUrl = getPublicAppUrl(req).replace(/\/$/, "");
    const payload: Record<string, unknown> = {
      reason: `MyCellar ${plan.name}`,
      external_reference: `${user.id}:${plan.id}:${Date.now()}`,
      payer_email: user.email,
      back_url: `${baseUrl}/billing?checkout=return`,
      status: "pending",
      auto_recurring: autoRecurring,
    };
    const externalReference = payload.external_reference as string;

    if (process.env.MERCADO_PAGO_WEBHOOK_URL) {
      payload.notification_url = process.env.MERCADO_PAGO_WEBHOOK_URL;
    }

    try {
      const response = await fetch("https://api.mercadopago.com/preapproval", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": randomUUID(),
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as MercadoPagoPreapprovalResponse;

      if (!response.ok || !data.init_point) {
        req.log?.warn(
          {
            statusCode: response.status,
            providerStatus: data.status,
            providerError: data.error,
            providerMessage: data.message,
          },
          "Mercado Pago checkout creation failed",
        );
        return res.status(502).json({ error: "Could not create Mercado Pago checkout" });
      }

      await ensureBillingSchema();
      await pool.query(
        `
          INSERT INTO billing_subscriptions (
            user_id,
            user_email,
            plan_id,
            provider_subscription_id,
            external_reference,
            status,
            provider_status,
            checkout_url,
            sandbox_checkout_url,
            raw_payload
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
          ON CONFLICT (external_reference)
          DO UPDATE SET
            provider_subscription_id = EXCLUDED.provider_subscription_id,
            status = EXCLUDED.status,
            provider_status = EXCLUDED.provider_status,
            checkout_url = EXCLUDED.checkout_url,
            sandbox_checkout_url = EXCLUDED.sandbox_checkout_url,
            raw_payload = EXCLUDED.raw_payload,
            updated_at = now()
        `,
        [
          user.id,
          user.email,
          plan.id,
          data.id ?? null,
          externalReference,
          normalizeSubscriptionStatus(data.status),
          data.status ?? null,
          data.init_point,
          data.sandbox_init_point ?? null,
          JSON.stringify(data),
        ],
      );

      return res.status(201).json({
        checkoutUrl: data.init_point,
        subscriptionId: data.id,
        status: data.status,
        sandboxCheckoutUrl: data.sandbox_init_point,
      });
    } catch (err) {
      req.log?.error({ err }, "Mercado Pago checkout request failed");
      return res.status(502).json({ error: "Could not reach Mercado Pago" });
    }
  },
);

router.post("/billing/mercado-pago/webhook", async (req: any, res: any) => {
  await ensureBillingSchema();

  const body = (req.body ?? {}) as MercadoPagoWebhookBody;
  const topic = String(body.type ?? body.topic ?? req.query?.type ?? req.query?.topic ?? "");
  const dataId = getDataId(req, body);

  if (!verifyWebhookSignature(req, dataId)) {
    req.log?.warn({ topic, dataId }, "Invalid Mercado Pago webhook signature");
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  const eventResult = await pool.query(
    `
      INSERT INTO billing_webhook_events (
        provider_event_id,
        provider_topic,
        provider_action,
        provider_data_id,
        provider_payload
      )
      VALUES ($1, $2, $3, $4, $5::jsonb)
      RETURNING id
    `,
    [
      body.id != null ? String(body.id) : null,
      topic || null,
      body.action ?? null,
      dataId || null,
      JSON.stringify({ query: req.query, body }),
    ],
  );

  if (!dataId) {
    return res.status(202).json({ received: true, processed: false });
  }

  if (topic && !["subscription_preapproval", "preapproval"].includes(topic)) {
    return res.status(202).json({ received: true, processed: false });
  }

  try {
    const subscription = await fetchMercadoPagoPreapproval(dataId);
    await upsertSubscriptionFromProvider(subscription);
    await pool.query("UPDATE billing_webhook_events SET processed_at = now() WHERE id = $1", [
      eventResult.rows[0]?.id,
    ]);
    return res.status(200).json({ received: true, processed: true });
  } catch (err) {
    req.log?.error({ err, topic, dataId }, "Mercado Pago webhook processing failed");
    return res.status(202).json({ received: true, processed: false });
  }
});

export default router;
