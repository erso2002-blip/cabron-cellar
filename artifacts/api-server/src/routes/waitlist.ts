import { Router } from "express";
import { db, eq, insertWaitlistLeadSchema, waitlistLeadsTable } from "@workspace/db";
import { rateLimit } from "../middlewares/rateLimit.js";

const router = Router();

router.post(
  "/waitlist",
  rateLimit({ keyPrefix: "waitlist", windowMs: 60_000, max: 5 }),
  async (req: any, res: any) => {
    const parsed = insertWaitlistLeadSchema.safeParse({
      name: req.body?.name,
      email: req.body?.email,
      whatsapp: req.body?.whatsapp || null,
      source: req.body?.source || "instagram",
      notes: req.body?.notes || null,
    });

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid waitlist lead" });
    }

    try {
      const [lead] = await db
        .insert(waitlistLeadsTable)
        .values(parsed.data)
        .onConflictDoUpdate({
          target: waitlistLeadsTable.email,
          set: {
            name: parsed.data.name,
            whatsapp: parsed.data.whatsapp ?? null,
            source: parsed.data.source ?? "instagram",
            notes: parsed.data.notes ?? null,
          },
        })
        .returning({
          id: waitlistLeadsTable.id,
          email: waitlistLeadsTable.email,
        });

      return res.status(201).json({ ok: true, lead });
    } catch (err) {
      req.log?.error({ err }, "Failed to save waitlist lead");
      return res.status(500).json({ error: "Could not save waitlist lead" });
    }
  },
);

router.get("/waitlist/check", async (_req: any, res: any) => {
  res.json({ ok: true });
});

export default router;
