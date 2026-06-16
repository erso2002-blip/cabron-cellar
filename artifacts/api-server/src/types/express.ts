type PublicUser = {
  id: string;
  name: string;
  email: string | null;
  profileImage: string | null;
};

declare global {
  namespace Express {
    interface User extends PublicUser {}

    interface Request {
      user?: User;
      isAuthenticated(): boolean;
    }
  }
}

export type { PublicUser };
