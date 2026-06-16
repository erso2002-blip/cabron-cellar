import { type Request, type Response, type NextFunction } from "express";

type PublicUser = {
  id: string;
  name: string;
  email: string | null;
  profileImage: string | null;
};

declare module "express-serve-static-core" {
  interface Request {
    user?: PublicUser;
    isAuthenticated(): boolean;
  }
}

const PUBLIC_USER: PublicUser = {
  id: "public-cabron-cellar",
  name: "Cabron Cellar",
  email: null,
  profileImage: null,
};

export function publicUserMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  req.user = PUBLIC_USER;
  req.isAuthenticated = function () {
    return this.user != null;
  };

  next();
}
