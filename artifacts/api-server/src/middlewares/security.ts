import type { NextFunction, Request, Response } from "express";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://cabron-cellar.vercel.app",
  "https://cabron-cellar-ten.vercel.app",
];

function configuredOrigins() {
  return (process.env.MYCELLAR_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function allowedOrigins() {
  const origins = new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins()]);

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://localhost:4173");
    origins.add("http://localhost:5173");
    origins.add("http://127.0.0.1:3000");
    origins.add("http://127.0.0.1:4173");
    origins.add("http://127.0.0.1:5173");
  }

  return origins;
}

export function corsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) {
  if (!origin || allowedOrigins().has(origin)) {
    callback(null, true);
    return;
  }

  callback(null, false);
}

export function securityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );

  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  next();
}
