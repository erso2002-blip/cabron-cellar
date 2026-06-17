import { Router } from "express";
import { and, consumptionTable, db, desc, eq, sql, winesTable } from "@workspace/db";
import { getAuthenticatedUser } from "../lib/auth.js";

const router = Router();

function parsePositiveInteger(value: string) {
  if (!/^\d+$/.test(value)) return NaN;
  return Number(value);
}

// GET /consumption
router.get("/consumption", async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = user.id;
  const limit = parseInt((req.query.limit as string) || "20");
  const offset = parseInt((req.query.offset as string) || "0");

  const records = await db
    .select({
      id: consumptionTable.id,
      wineId: consumptionTable.wineId,
      userId: consumptionTable.userId,
      consumedAt: consumptionTable.consumedAt,
      personalNote: consumptionTable.personalNote,
      occasion: consumptionTable.occasion,
      wouldBuyAgain: consumptionTable.wouldBuyAgain,
      quantity: consumptionTable.quantity,
      createdAt: consumptionTable.createdAt,
      wineName: winesTable.name,
      wineProducer: winesTable.producer,
      wineVintage: winesTable.vintage,
      labelPhotoUrl: winesTable.labelPhotoUrl,
    })
    .from(consumptionTable)
    .leftJoin(winesTable, eq(consumptionTable.wineId, winesTable.id))
    .where(eq(consumptionTable.userId, userId))
    .orderBy(desc(consumptionTable.consumedAt))
    .limit(limit)
    .offset(offset);

  return res.json(records);
});

// DELETE /consumption/:id/restore
router.delete("/consumption/:id/restore", async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = parsePositiveInteger(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid consumption id" });
  }

  const restoredWine = await db.transaction(async (tx) => {
    const [record] = await tx
      .select()
      .from(consumptionTable)
      .where(and(eq(consumptionTable.id, id), eq(consumptionTable.userId, user.id)));

    if (!record) return null;

    const [wine] = await tx
      .update(winesTable)
      .set({ quantity: sql`${winesTable.quantity} + ${record.quantity}` })
      .where(and(eq(winesTable.id, record.wineId), eq(winesTable.userId, user.id)))
      .returning();

    if (!wine) return null;

    await tx
      .delete(consumptionTable)
      .where(and(eq(consumptionTable.id, id), eq(consumptionTable.userId, user.id)));

    return wine;
  });

  if (!restoredWine) {
    return res.status(404).json({ error: "Consumption record not found" });
  }

  return res.json({
    ...restoredWine,
    pricePaid: restoredWine.pricePaid ? parseFloat(restoredWine.pricePaid) : null,
  });
});

export default router;
