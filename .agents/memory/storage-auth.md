---
name: Object storage endpoint auth
description: Private storage routes must be authenticated in the multi-user (per-user cellar) model
---

# Storage endpoint authorization

`/storage/uploads/request-url` and `/storage/objects/*` must require an authenticated user (`req.isAuthenticated()`). The object-storage template ships these routes **unauthenticated** (the ACL/auth block is commented out) — that is an auth bypass once the app has per-user data.

**Why:** With per-user cellars, any invited-but-not-signed-in visitor could otherwise request upload URLs or read private objects.

**How to apply:**
- Auth-only is sufficient here because object paths are unguessable random UUIDs and each user only ever receives their own wines' `labelPhotoUrl`.
- Full per-object ACL (`canAccessObject`) is NOT wired: uploads never call `trySetObjectEntityAclPolicy`, and `canAccessObject` denies when no ACL policy exists — so enforcing ACL would 403 every label photo. If you want owner-based ACL, you must set the owner ACL after upload (object must exist first) before turning on `canAccessObjectEntity` checks.
