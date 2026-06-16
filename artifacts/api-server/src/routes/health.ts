import { Router, type Request } from "express";

const router = Router();

router.get("/healthz", (_req: Request, res: any) => {
  res.json({ status: "ok" });
});

export default router;
