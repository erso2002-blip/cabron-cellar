import { type Request, type Response, type NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { AuthUser } from "@workspace/api-zod";

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;

      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

// Resolves the per-user identity from the verified Clerk session and makes
// sure a matching row exists in our users table (just-in-time provisioning).
// Each user's data is scoped by this Clerk user id, so everyone gets their
// own separate cellar.
export async function clerkUserMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    return next();
  }

  try {
    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      const cu = await clerkClient.users.getUser(userId);
      const email =
        cu.primaryEmailAddress?.emailAddress ??
        cu.emailAddresses[0]?.emailAddress ??
        null;

      [user] = await db
        .insert(usersTable)
        .values({
          id: userId,
          email,
          firstName: cu.firstName ?? null,
          lastName: cu.lastName ?? null,
          profileImageUrl: cu.imageUrl ?? null,
        })
        .onConflictDoNothing()
        .returning();

      // onConflictDoNothing returns nothing on a race — re-read the row.
      if (!user) {
        [user] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, userId));
      }
    }

    req.user = {
      id: userId,
      name:
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        user?.email ||
        "Usuário",
      email: user?.email ?? null,
      profileImage: user?.profileImageUrl ?? null,
    };
  } catch (err) {
    req.log.error({ err }, "clerk user provisioning failed");
    // The Clerk session is verified, so keep the user signed in with their id
    // even if profile enrichment failed — their cellar still resolves.
    req.user = { id: userId, name: "Usuário", email: null, profileImage: null };
  }

  next();
}
