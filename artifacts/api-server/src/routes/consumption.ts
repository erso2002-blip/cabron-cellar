import { Router } from "express";
import { db } from "@workspace/db";
import { consumptionTable, winesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// GET /consumption
router.get("/consumption", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = req.user!.id;
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

export default router;
