import { Router } from "express";
import {
  accountDeletionRequestsTable,
  db,
  eq,
  notificationPreferencesTable,
  pool,
  usersTable,
} from "@workspace/db";
import { getAuthenticatedUser } from "../lib/auth.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const router = Router();

type ProfilePayload = {
  name?: unknown;
  phone?: unknown;
};

type NotificationPayload = {
  cellarReminders?: unknown;
  emailUpdates?: unknown;
  productUpdates?: unknown;
  pushEnabled?: unknown;
};

let accountSchemaReady: Promise<void> | null = null;

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, maxLength) : null;
}

function parseName(value: unknown) {
  const name = normalizeText(value, 160);
  if (!name) return { firstName: null, lastName: null, name: null };

  const parts = name.split(" ");
  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
    name,
  };
}

function publicProfile(row: {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  profileImageUrl: string | null;
}) {
  const name = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
  return {
    id: row.id,
    name: name || row.email || "Usuário MyCellar",
    email: row.email,
    phone: row.phone,
    profileImage: row.profileImageUrl,
  };
}

function notificationResponse(row: {
  cellarReminders: boolean;
  emailUpdates: boolean;
  productUpdates: boolean;
  pushEnabled: boolean;
}) {
  return {
    cellarReminders: row.cellarReminders,
    emailUpdates: row.emailUpdates,
    productUpdates: row.productUpdates,
    pushEnabled: row.pushEnabled,
  };
}

async function ensureAccountSchema() {
  if (!accountSchemaReady) {
    accountSchemaReady = (async () => {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone varchar`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notification_preferences (
          user_id varchar PRIMARY KEY,
          cellar_reminders boolean NOT NULL DEFAULT true,
          email_updates boolean NOT NULL DEFAULT true,
          product_updates boolean NOT NULL DEFAULT false,
          push_enabled boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS account_deletion_requests (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id varchar NOT NULL,
          email varchar,
          name varchar,
          status varchar NOT NULL DEFAULT 'pending',
          source varchar NOT NULL DEFAULT 'app',
          metadata jsonb,
          requested_at timestamptz NOT NULL DEFAULT now(),
          processed_at timestamptz
        )
      `);
    })();
  }

  return accountSchemaReady;
}

async function getProfile(userId: string) {
  await ensureAccountSchema();

  const [row] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      phone: usersTable.phone,
      profileImageUrl: usersTable.profileImageUrl,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  return row ? publicProfile(row) : null;
}

async function getNotificationPreferences(userId: string) {
  await ensureAccountSchema();

  const [existing] = await db
    .select()
    .from(notificationPreferencesTable)
    .where(eq(notificationPreferencesTable.userId, userId));

  if (existing) return notificationResponse(existing);

  const [created] = await db
    .insert(notificationPreferencesTable)
    .values({ userId })
    .returning();

  return notificationResponse(created);
}

router.get("/account/profile", async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const profile = await getProfile(user.id);
  if (!profile) return res.status(404).json({ error: "User not found" });

  return res.json(profile);
});

router.put(
  "/account/profile",
  rateLimit({ keyPrefix: "account-profile-update", windowMs: 15 * 60_000, max: 20 }),
  async (req: any, res: any) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    await ensureAccountSchema();

    const body = (req.body ?? {}) as ProfilePayload;
    const parsedName = parseName(body.name);
    const phone = normalizeText(body.phone, 40);

    if (!parsedName.name) {
      return res.status(400).json({ error: "Nome obrigatório" });
    }

    const [updated] = await db
      .update(usersTable)
      .set({
        firstName: parsedName.firstName,
        lastName: parsedName.lastName,
        phone,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id))
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        phone: usersTable.phone,
        profileImageUrl: usersTable.profileImageUrl,
      });

    if (!updated) return res.status(404).json({ error: "User not found" });

    return res.json(publicProfile(updated));
  },
);

router.get("/account/notifications", async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const preferences = await getNotificationPreferences(user.id);
  return res.json(preferences);
});

router.put(
  "/account/notifications",
  rateLimit({ keyPrefix: "account-notifications-update", windowMs: 15 * 60_000, max: 30 }),
  async (req: any, res: any) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    await ensureAccountSchema();

    const current = await getNotificationPreferences(user.id);
    const body = (req.body ?? {}) as NotificationPayload;
    const values = {
      cellarReminders:
        typeof body.cellarReminders === "boolean"
          ? body.cellarReminders
          : current.cellarReminders,
      emailUpdates:
        typeof body.emailUpdates === "boolean" ? body.emailUpdates : current.emailUpdates,
      productUpdates:
        typeof body.productUpdates === "boolean"
          ? body.productUpdates
          : current.productUpdates,
      pushEnabled:
        typeof body.pushEnabled === "boolean" ? body.pushEnabled : current.pushEnabled,
      updatedAt: new Date(),
    };

    const [updated] = await db
      .insert(notificationPreferencesTable)
      .values({ userId: user.id, ...values })
      .onConflictDoUpdate({
        target: notificationPreferencesTable.userId,
        set: values,
      })
      .returning();

    return res.json(notificationResponse(updated));
  },
);

router.post(
  "/account/deletion-request",
  rateLimit({ keyPrefix: "account-deletion-request", windowMs: 60 * 60_000, max: 3 }),
  async (req: any, res: any) => {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    await ensureAccountSchema();

    const profile = await getProfile(user.id);
    const [request] = await db
      .insert(accountDeletionRequestsTable)
      .values({
        userId: user.id,
        email: profile?.email ?? user.email ?? null,
        name: profile?.name ?? user.name ?? null,
        status: "pending",
        source: "app",
        metadata: {
          userAgent: req.headers["user-agent"] ?? null,
          ip: req.ip ?? null,
        },
      })
      .returning({
        id: accountDeletionRequestsTable.id,
        status: accountDeletionRequestsTable.status,
        requestedAt: accountDeletionRequestsTable.requestedAt,
      });

    req.log?.info({ requestId: request.id, userId: user.id }, "Account deletion requested");

    return res.status(202).json({
      ok: true,
      requestId: request.id,
      status: request.status,
      requestedAt: request.requestedAt,
    });
  },
);

export default router;
