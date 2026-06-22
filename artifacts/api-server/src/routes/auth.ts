import { Router } from "express";
import { getAuthenticatedUser } from "../lib/auth.js";
import {
  isEmailLoginDeliveryConfigured,
} from "../lib/emailDelivery.js";
import {
  createEmailSessionForUser,
  requestEmailLoginCode,
  verifyEmailLoginCode,
} from "../lib/emailAuth.js";
import { getGoogleSsoConfig, verifyGoogleUser } from "../middlewares/googleAuth.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import {
  CLOSED_BETA_ACCESS_DENIED_ERROR,
  isClosedBetaAccessEnabled,
} from "../lib/closedBetaAccess.js";

const router = Router();

router.get("/auth/config", (_req: any, res: any) => {
  res.json({
    ...getGoogleSsoConfig(),
    closedBeta: {
      enabled: isClosedBetaAccessEnabled(),
    },
    emailLogin: {
      configured: isEmailLoginDeliveryConfigured(),
    },
  });
});

router.get("/auth/user", (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.json(user);
});

router.post(
  "/auth/google/session",
  rateLimit({ keyPrefix: "google-login-session", windowMs: 15 * 60_000, max: 20 }),
  async (req: any, res: any) => {
    try {
      const googleToken = typeof req.body?.token === "string" ? req.body.token : "";
      if (!googleToken) {
        return res.status(400).json({ error: "Invalid Google token" });
      }

      const user = await verifyGoogleUser(googleToken);
      const token = await createEmailSessionForUser(user.id);
      return res.json({ token, user });
    } catch (err) {
      req.log?.warn({ err }, "Google session creation failed");
      if (err instanceof Error && err.message === CLOSED_BETA_ACCESS_DENIED_ERROR) {
        return res.status(403).json({ error: CLOSED_BETA_ACCESS_DENIED_ERROR });
      }
      return res.status(401).json({ error: "Unauthorized" });
    }
  },
);

router.post(
  "/auth/email/request",
  rateLimit({ keyPrefix: "email-login-request", windowMs: 15 * 60_000, max: 5 }),
  async (req: any, res: any) => {
    try {
      const result = await requestEmailLoginCode(req.body?.email);
      if (!result.ok) {
        return res.status(result.status).json({ error: result.error });
      }

      return res.json({ ok: true });
    } catch (err) {
      req.log?.error({ err }, "Failed to send email login code");
      return res.status(503).json({ error: "Email login is not configured" });
    }
  },
);

router.post(
  "/auth/email/verify",
  rateLimit({ keyPrefix: "email-login-verify", windowMs: 15 * 60_000, max: 10 }),
  async (req: any, res: any) => {
    try {
      const result = await verifyEmailLoginCode(req.body?.email, req.body?.code);
      if (!result.ok) {
        return res.status(result.status).json({ error: result.error });
      }

      return res.json({ token: result.token, user: result.user });
    } catch (err) {
      req.log?.error({ err }, "Failed to verify email login code");
      return res.status(500).json({ error: "Could not verify login code" });
    }
  },
);

export default router;
