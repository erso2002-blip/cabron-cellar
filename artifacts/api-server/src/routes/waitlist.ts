import { Router } from "express";
import {
  db,
  eq,
  insertWaitlistLeadSchema,
  sql,
  usersTable,
  waitlistLeadsTable,
} from "@workspace/db";
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

router.get("/waitlist/report", async (req: any, res: any) => {
  const reportToken = process.env.WAITLIST_REPORT_TOKEN;
  if (!reportToken || req.headers["x-waitlist-report-token"] !== reportToken) {
    return res.status(404).json({ error: "Not found" });
  }

  try {
    const rows = await db
      .select({
        id: waitlistLeadsTable.id,
        name: waitlistLeadsTable.name,
        email: waitlistLeadsTable.email,
        whatsapp: waitlistLeadsTable.whatsapp,
        source: waitlistLeadsTable.source,
        notes: waitlistLeadsTable.notes,
        requestedAt: waitlistLeadsTable.createdAt,
        userId: usersTable.id,
        userCreatedAt: usersTable.createdAt,
        userUpdatedAt: usersTable.updatedAt,
      })
      .from(waitlistLeadsTable)
      .leftJoin(
        usersTable,
        sql`lower(${usersTable.email}) = ${waitlistLeadsTable.email}`,
      );

    const bySource = new Map<
      string,
      { source: string; requested: number; loggedIn: number; pending: number; conversionRate: number }
    >();

    for (const row of rows) {
      const source = row.source || "waitlist";
      const current =
        bySource.get(source) ||
        { source, requested: 0, loggedIn: 0, pending: 0, conversionRate: 0 };

      current.requested += 1;
      if (row.userId) current.loggedIn += 1;
      bySource.set(source, current);
    }

    const sources = Array.from(bySource.values()).map((item) => ({
      ...item,
      pending: item.requested - item.loggedIn,
      conversionRate:
        item.requested > 0 ? Number((item.loggedIn / item.requested).toFixed(4)) : 0,
    }));

    const requested = rows.length;
    const loggedIn = rows.filter((row) => row.userId).length;

    return res.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      summary: {
        requested,
        loggedIn,
        pending: requested - loggedIn,
        conversionRate:
          requested > 0 ? Number((loggedIn / requested).toFixed(4)) : 0,
      },
      sources,
      leads: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        whatsapp: row.whatsapp,
        source: row.source,
        requestedAt: row.requestedAt,
        loggedIn: Boolean(row.userId),
        firstLoginDetectedAt: row.userCreatedAt,
        lastLoginSignalAt: row.userUpdatedAt,
        notes: row.notes,
      })),
    });
  } catch (err) {
    req.log?.error({ err }, "Failed to generate waitlist report");
    return res.status(500).json({ error: "Could not generate waitlist report" });
  }
});

export default router;
