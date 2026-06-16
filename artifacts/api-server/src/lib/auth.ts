import type { Request } from "express";
import type { PublicUser } from "../types/express.js";

type PublicAuthRequest = Request & {
  user?: PublicUser;
  isAuthenticated?: () => boolean;
};

export function attachPublicUser(req: Request, user: PublicUser) {
  const authReq = req as PublicAuthRequest;
  authReq.user = user;
  authReq.isAuthenticated = function (this: PublicAuthRequest) {
    return this.user != null;
  };
}

export function getAuthenticatedUser(req: Request): PublicUser | null {
  const authReq = req as PublicAuthRequest;
  if (!authReq.isAuthenticated?.() || !authReq.user) {
    return null;
  }

  return authReq.user;
}
