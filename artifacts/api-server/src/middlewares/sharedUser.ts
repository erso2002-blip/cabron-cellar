import { type Request, type Response, type NextFunction } from "express";

// MVP shared-cellar identity. Once a visitor passes the invite-code gate they
// all operate on the same shared cellar — no per-user Replit login required.
export const SHARED_USER_ID = "mvp-shared-cellar";

export function sharedUserMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  // Authoritative: always use the shared cellar identity once the invite gate
  // has passed, so a stale Replit OAuth session can never fragment the data.
  req.user = {
    id: SHARED_USER_ID,
    name: "Cabron Cellar",
    email: null,
    profileImage: null,
  };
  next();
}
