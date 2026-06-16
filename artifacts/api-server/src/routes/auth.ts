import { Router } from "express";
import { getAuthenticatedUser } from "../lib/auth.js";
import { getGoogleSsoConfig } from "../middlewares/googleAuth.js";

const router = Router();

router.get("/auth/config", (_req: any, res: any) => {
  res.json(getGoogleSsoConfig());
});

router.get("/auth/user", (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.json(user);
});

export default router;
