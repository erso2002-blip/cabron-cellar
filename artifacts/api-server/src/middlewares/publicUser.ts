import { type Request, type Response, type NextFunction } from "express";

type PublicUser = {
  id: string;
  name: string;
  email: string | null;
  profileImage: string | null;
};

const PUBLIC_USER: PublicUser = {
  id: "public-cabron-cellar",
  name: "Cabron Cellar",
  email: null,
  profileImage: null,
};

declare global {
  namespace Express {
    interface User extends PublicUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;
      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

export function publicUserMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  req.user = PUBLIC_USER;
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  next();
}
