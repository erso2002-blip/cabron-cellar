import { type Request, type Response } from "express";

type PublicUser = {
  id: string;
  name: string;
  email: string | null;
  profileImage: string | null;
};

type PublicRequest = Request & {
  user?: PublicUser;
  isAuthenticated?: () => boolean;
};

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
  const publicReq = req as PublicRequest;

  publicReq.user = PUBLIC_USER;
  publicReq.isAuthenticated = function () {
    return publicReq.user != null;
  };

  next();
}
