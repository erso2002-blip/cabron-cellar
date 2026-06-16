import type { Request } from "express";
import type { PublicUser } from "../types/express.js";
import { isGoogleSsoConfigured } from "../middlewares/googleAuth.js";

const LEGACY_PUBLIC_USER: PublicUser = {
  id: "public-cabron-cellar",
  name: "MyCellar",
  email: null,
  profileImage: null,
};

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
    return isGoogleSsoConfigured() ? null : LEGACY_PUBLIC_USER;
  }

  return authReq.user;
}
