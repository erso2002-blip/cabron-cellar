import { type Request, type Response } from "express";
import type { PublicUser } from "../types/express.js";
import { attachPublicUser } from "../lib/auth.js";

const PUBLIC_USER: PublicUser = {
  id: "public-cabron-cellar",
  name: "MyCellar",
  email: null,
  profileImage: null,
};

export function publicUserMiddleware(
  req: Request,
  _res: Response,
  next: () => void,
) {
  attachPublicUser(req, PUBLIC_USER);

  next();
}
