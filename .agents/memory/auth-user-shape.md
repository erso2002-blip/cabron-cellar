---
name: Auth User Shape
description: The shape of the user object stored in SessionData must match the AuthUser type from @workspace/api-zod, not the DB columns.
---

The `AuthUser` type from `@workspace/api-zod` has: `id`, `name`, `profileImage`, `email`.

The DB `usersTable` has: `id`, `firstName`, `lastName`, `profileImageUrl`, `email`.

When building `SessionData.user` in the OIDC callback, always map DB → AuthUser:
```ts
user: {
  id: dbUser.id,
  name: [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ") || dbUser.email || "User",
  email: dbUser.email,
  profileImage: dbUser.profileImageUrl,
}
```

**Why:** The `User` interface on `Express.Request` extends `AuthUser`, so any code reading `req.user.firstName` etc will fail with TS2339. The mapping must happen once at session creation.

**How to apply:** Any time auth.ts builds SessionData.user, use the mapped shape above.
