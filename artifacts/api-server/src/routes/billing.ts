import { randomUUID } from "node:crypto";
import { Router } from "express";
import { getAuthenticatedUser } from "../lib/auth.js";
import { billingPlans, getBillingPlan } from "../lib/billingPlans.js";
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

router.get("/billing/plans", (_req: any, res: any) => {
  res.json({
    plans: billingPlans,
    provider: {
      name: "Mercado Pago",
      configured: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN),
    },
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

export default router;

