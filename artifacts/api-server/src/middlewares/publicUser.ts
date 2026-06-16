import { type Request, type Response } from "express";
import type { PublicUser } from "../types/express.js";

const PUBLIC_USER: PublicUser = {
  id: "public-cabron-cellar",
  name: "Cabron Cellar",
  email: null,
  profileImage: null,
};

export function publicUserMiddleware(
  req: Request,
  _res: Response,
  next: () => void,
) {
  req.user = PUBLIC_USER;
  req.isAuthenticated = function () {
    return this.user != null;
  };

  next();
}
