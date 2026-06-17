import { type Request, type Response } from "express";
import { OAuth2Client } from "google-auth-library";
import {
  db,
  usersTable,
} from "@workspace/db";
import { attachPublicUser } from "../lib/auth.js";
import {
  isEmailSessionToken,
  verifyEmailSessionToken,
} from "../lib/emailAuth.js";
import {
  canImportLegacyCellar,
  migrateLegacyCellarIfNeeded,
} from "../lib/legacyCellar.js";
import type { PublicUser } from "../types/express.js";

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ?? process.env.VITE_GOOGLE_CLIENT_ID ?? null;

const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

export function isGoogleSsoConfigured() {
  return Boolean(googleClient && googleClientId);
}

function getBearerToken(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

function displayName(payload: {
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
}) {
  const explicitName = payload.name?.trim();
  if (explicitName) return explicitName;

  const composedName = [payload.given_name, payload.family_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (composedName) return composedName;

  return payload.email ?? "Google user";
}

async function verifyGoogleUser(token: string): Promise<PublicUser> {
  if (!googleClient || !googleClientId) {
    throw new Error("Google SSO is not configured");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error("Invalid Google token");
  }

  const user: PublicUser = {
    id: `google-${payload.sub}`,
    name: displayName(payload),
    email: payload.email,
    profileImage: payload.picture ?? null,
  };

  await db
    .insert(usersTable)
    .values({
      id: user.id,
      email: user.email,
      firstName: payload.given_name ?? null,
      lastName: payload.family_name ?? null,
      profileImageUrl: user.profileImage,
    })
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        email: user.email,
        firstName: payload.given_name ?? null,
        lastName: payload.family_name ?? null,
        profileImageUrl: user.profileImage,
        updatedAt: new Date(),
      },
    });

  if (canImportLegacyCellar(payload.email)) {
    await migrateLegacyCellarIfNeeded(user.id);
  }

  return user;
}

export async function googleAuthMiddleware(
  req: Request,
  res: Response,
  next: () => void,
) {
  const token = getBearerToken(req);
  if (!token) return next();

  try {
    if (isEmailSessionToken(token)) {
      const user = await verifyEmailSessionToken(token);
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      attachPublicUser(req, user);
      return next();
    }

    const user = await verifyGoogleUser(token);
    attachPublicUser(req, user);
    return next();
  } catch (error) {
    req.log?.warn({ err: error }, "Google authentication failed");
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function getGoogleSsoConfig() {
  return {
    provider: "google",
    configured: isGoogleSsoConfigured(),
    clientId: process.env.VITE_GOOGLE_CLIENT_ID ?? googleClientId,
  };
}
