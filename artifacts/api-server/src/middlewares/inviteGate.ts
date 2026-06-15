import { type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";

const INVITE_COOKIE = "invite_granted";
const INVITE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

function sign(value: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function makeToken(secret: string): string {
  const ts = Date.now().toString();
  const sig = sign(ts, secret);
  return `${ts}.${sig}`;
}

function verifyToken(token: string, secret: string): boolean {
  const [ts, sig] = token.split(".");
  if (!ts || !sig) return false;
  const expected = sign(ts, secret);
  // Constant-time compare
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  // Expire after 30 days
  if (Date.now() - parseInt(ts) > INVITE_TTL) return false;
  return true;
}

export function inviteGateMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const inviteCode = process.env.INVITE_CODE;
  // If no INVITE_CODE is set, gate is disabled
  if (!inviteCode) return next();

  const sessionSecret = process.env.SESSION_SECRET || inviteCode;

  // Allow the invite check & grant endpoints themselves to pass through
  if (req.path === "/invite/check" || req.path === "/invite/grant") {
    return next();
  }

  // Check for valid cookie
  const token = req.cookies?.[INVITE_COOKIE];
  if (token && verifyToken(token, sessionSecret)) {
    return next();
  }

  return res.status(403).json({ error: "invite_required" });
}

export function setInviteCookie(req: Request, res: Response) {
  const inviteCode = process.env.INVITE_CODE;
  if (!inviteCode) return res.json({ ok: true });

  const sessionSecret = process.env.SESSION_SECRET || inviteCode;
  const provided = (req.body as { code?: string }).code ?? "";

  // Constant-time compare
  const expected = Buffer.from(inviteCode);
  const actual = Buffer.from(provided);
  const match =
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual);

  if (!match) {
    return res.status(401).json({ error: "wrong_code" });
  }

  const token = makeToken(sessionSecret);
  res.cookie(INVITE_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: INVITE_TTL,
  });
  return res.json({ ok: true });
}
