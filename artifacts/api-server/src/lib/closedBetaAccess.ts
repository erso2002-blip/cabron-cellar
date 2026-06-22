const CLOSED_BETA_ALLOWED_EMAILS_ENV = "CLOSED_BETA_ALLOWED_EMAILS";
export const CLOSED_BETA_ACCESS_DENIED_ERROR = "Access is restricted to closed beta testers";

export function normalizeAccessEmail(email: unknown) {
  if (typeof email !== "string") return null;
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null;
  if (normalized.length > 180) return null;
  return normalized;
}

function parseAllowedEmails() {
  return (process.env[CLOSED_BETA_ALLOWED_EMAILS_ENV] ?? "")
    .split(/[,\n;\s]+/)
    .map((email) => normalizeAccessEmail(email))
    .filter((email): email is string => Boolean(email));
}

export function isClosedBetaAccessEnabled() {
  return parseAllowedEmails().length > 0;
}

export function isEmailAllowedForClosedBeta(email: unknown) {
  const normalized = normalizeAccessEmail(email);
  if (!normalized) return false;

  const allowedEmails = parseAllowedEmails();
  if (allowedEmails.length === 0) return true;

  return allowedEmails.includes(normalized);
}

export function closedBetaAccessDeniedResult() {
  return {
    ok: false as const,
    status: 403,
    error: CLOSED_BETA_ACCESS_DENIED_ERROR,
  };
}
