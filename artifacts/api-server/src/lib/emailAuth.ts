import crypto from "node:crypto";
import {
  and,
  db,
  desc,
  emailLoginCodesTable,
  emailSessionsTable,
  eq,
  sql,
  usersTable,
} from "@workspace/db";
import type { PublicUser } from "../types/express.js";
import { sendLoginCodeEmail } from "./emailDelivery.js";
import {
  canImportLegacyCellar,
  migrateLegacyCellarIfNeeded,
} from "./legacyCellar.js";
import {
  closedBetaAccessDeniedResult,
  isEmailAllowedForClosedBeta,
  normalizeAccessEmail,
} from "./closedBetaAccess.js";

const EMAIL_SESSION_TOKEN_PREFIX = "mc_email_";
const LOGIN_CODE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

function normalizeEmail(email: unknown) {
  return normalizeAccessEmail(email);
}

function codeHash(email: string, code: string) {
  return crypto
    .createHash("sha256")
    .update(`${email}:${code}:${process.env.EMAIL_LOGIN_PEPPER ?? ""}`)
    .digest("hex");
}

function tokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function userIdForEmail(email: string) {
  const digest = crypto.createHash("sha256").update(email).digest("hex").slice(0, 32);
  return `email-${digest}`;
}

function displayNameForEmail(email: string) {
  return email.split("@")[0] || email;
}

export function isEmailSessionToken(token: string) {
  return token.startsWith(EMAIL_SESSION_TOKEN_PREFIX);
}

export async function createEmailSessionForUser(userId: string) {
  const token = `${EMAIL_SESSION_TOKEN_PREFIX}${crypto.randomBytes(32).toString("base64url")}`;
  await db.insert(emailSessionsTable).values({
    userId,
    tokenHash: tokenHash(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });

  return token;
}

export async function requestEmailLoginCode(rawEmail: unknown) {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    return { ok: false as const, status: 400, error: "Invalid email" };
  }
  if (!isEmailAllowedForClosedBeta(email)) {
    return closedBetaAccessDeniedResult();
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + LOGIN_CODE_TTL_MS);

  await db.insert(emailLoginCodesTable).values({
    email,
    codeHash: codeHash(email, code),
    expiresAt,
  });

  await sendLoginCodeEmail({ email, code });

  return { ok: true as const };
}

export async function verifyEmailLoginCode(rawEmail: unknown, rawCode: unknown) {
  const email = normalizeEmail(rawEmail);
  const code = typeof rawCode === "string" ? rawCode.trim() : "";
  if (!email || !/^\d{6}$/.test(code)) {
    return { ok: false as const, status: 400, error: "Invalid code" };
  }
  if (!isEmailAllowedForClosedBeta(email)) {
    return closedBetaAccessDeniedResult();
  }

  const [record] = await db
    .select()
    .from(emailLoginCodesTable)
    .where(
      and(
        eq(emailLoginCodesTable.email, email),
        sql`${emailLoginCodesTable.usedAt} is null`,
        sql`${emailLoginCodesTable.expiresAt} > now()`,
      ),
    )
    .orderBy(desc(emailLoginCodesTable.createdAt))
    .limit(1);

  if (!record || record.attempts >= MAX_CODE_ATTEMPTS) {
    return { ok: false as const, status: 400, error: "Invalid code" };
  }

  const expected = Buffer.from(record.codeHash, "hex");
  const actual = Buffer.from(codeHash(email, code), "hex");
  const matches =
    expected.length === actual.length && crypto.timingSafeEqual(expected, actual);

  if (!matches) {
    await db
      .update(emailLoginCodesTable)
      .set({ attempts: record.attempts + 1 })
      .where(eq(emailLoginCodesTable.id, record.id));
    return { ok: false as const, status: 400, error: "Invalid code" };
  }

  await db
    .update(emailLoginCodesTable)
    .set({ usedAt: new Date() })
    .where(eq(emailLoginCodesTable.id, record.id));

  const userId = userIdForEmail(email);
  const user: PublicUser = {
    id: userId,
    name: displayNameForEmail(email),
    email,
    profileImage: null,
  };

  await db
    .insert(usersTable)
    .values({
      id: user.id,
      email: user.email,
      firstName: user.name,
      lastName: null,
      profileImageUrl: null,
    })
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        email: user.email,
        firstName: user.name,
        lastName: null,
        profileImageUrl: null,
        updatedAt: new Date(),
      },
    });

  if (canImportLegacyCellar(email)) {
    await migrateLegacyCellarIfNeeded(user.id);
  }

  const token = await createEmailSessionForUser(userId);

  return { ok: true as const, token, user };
}

export async function verifyEmailSessionToken(token: string): Promise<PublicUser | null> {
  if (!isEmailSessionToken(token)) return null;

  const [session] = await db
    .select()
    .from(emailSessionsTable)
    .where(
      and(
        eq(emailSessionsTable.tokenHash, tokenHash(token)),
        sql`${emailSessionsTable.revokedAt} is null`,
        sql`${emailSessionsTable.expiresAt} > now()`,
      ),
    )
    .limit(1);

  if (!session) return null;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.userId))
    .limit(1);

  if (!user) return null;
  if (!isEmailAllowedForClosedBeta(user.email)) return null;

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return {
    id: user.id,
    name: name || user.email || "MyCellar user",
    email: user.email ?? null,
    profileImage: user.profileImageUrl ?? null,
  };
}
