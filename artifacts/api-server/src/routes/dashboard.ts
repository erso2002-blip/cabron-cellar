import { Router } from "express";
import { consumptionTable, count, db, desc, eq, sql, winesTable } from "@workspace/db";
import { getAuthenticatedUser } from "../lib/auth.js";

const router = Router();

// GET /dashboard/stats
router.get("/dashboard/stats", async (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = user.id;

  // Total bottles and wines
  const [totals] = await db
    .select({
      totalBottles: sql<number>`COALESCE(SUM(${winesTable.quantity}), 0)::int`,
      totalWines: count(),
      estimatedValue: sql<number>`COALESCE(SUM(${winesTable.quantity} * CAST(${winesTable.pricePaid} AS NUMERIC)), 0)`,
    })
    .from(winesTable)
    .where(eq(winesTable.userId, userId));

  // Wines approaching drink deadline (upcoming 180 days or overdue)
  const [drinkSoonCount] = await db
    .select({ count: count() })
    .from(winesTable)
    .where(
      sql`${winesTable.userId} = ${userId} AND ${winesTable.drinkUntil} IS NOT NULL AND ${winesTable.drinkUntil} <= CURRENT_DATE + INTERVAL '180 days' AND ${winesTable.quantity} > 0`
    );

  // Recent consumptions (last 5) with wine info
  const recentConsumptions = await db
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
    .limit(5);

  // Top countries
  const topCountries = await db
    .select({
      country: winesTable.country,
      count: sql<number>`SUM(${winesTable.quantity})::int`,
    })
    .from(winesTable)
    .where(sql`${winesTable.userId} = ${userId} AND ${winesTable.country} IS NOT NULL`)
    .groupBy(winesTable.country)
    .orderBy(sql`SUM(${winesTable.quantity}) DESC`)
    .limit(5);

  return res.json({
    totalBottles: totals?.totalBottles ?? 0,
    totalWines: totals?.totalWines ?? 0,
    estimatedValue: parseFloat(String(totals?.estimatedValue ?? 0)),
    winesDrinkSoonCount: drinkSoonCount?.count ?? 0,
    recentConsumptions,
    topCountries: topCountries
      .filter((c) => c.country)
      .map((c) => ({ country: c.country!, count: c.count })),
  });
});

export default router;
