import { Router } from "express";
import { and, consumptionTable, db, desc, eq, ilike, or, sql, winesTable } from "@workspace/db";
import {
  CreateWineBody,
  UpdateWineBody,
  ConsumeWineBody,
  UploadWineLabelBody,
} from "@workspace/api-zod";
import { getAuthenticatedUser } from "../lib/auth.js";

const router = Router();

function routeParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

// GET /wines
router.get("/wines", async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = user.id;
  const { search, country, region, grape, vintage, minQuantity } = req.query as Record<string, string>;

  const conditions = [eq(winesTable.userId, userId)];

  if (search) {
    conditions.push(
      or(
        ilike(winesTable.name, `%${search}%`),
        ilike(winesTable.producer, `%${search}%`),
        ilike(winesTable.grape, `%${search}%`)
      )!
    );
  }
  if (country) conditions.push(ilike(winesTable.country, `%${country}%`));
  if (region) conditions.push(ilike(winesTable.region, `%${region}%`));
  if (grape) conditions.push(ilike(winesTable.grape, `%${grape}%`));
  if (vintage) conditions.push(eq(winesTable.vintage, parseInt(vintage)));
  if (minQuantity) conditions.push(sql`${winesTable.quantity} >= ${parseInt(minQuantity)}`);

  const wines = await db
    .select()
    .from(winesTable)
    .where(and(...conditions))
    .orderBy(desc(winesTable.createdAt));

  return res.json(
    wines.map((w) => ({
      ...w,
      pricePaid: w.pricePaid ? parseFloat(w.pricePaid) : null,
    }))
  );
});

// POST /wines
router.post("/wines", async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = user.id;

  const parsed = CreateWineBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation error" });
  }

  const { pricePaid, ...rest } = parsed.data;
  const [wine] = await db
    .insert(winesTable)
    .values({
      ...rest,
      userId,
      pricePaid: pricePaid != null ? String(pricePaid) : null,
    })
    .returning();

  return res.status(201).json({
    ...wine,
    pricePaid: wine.pricePaid ? parseFloat(wine.pricePaid) : null,
  });
});

// GET /wines/drink-soon — must be before /wines/:id
router.get("/wines/drink-soon", async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = user.id;
  const limit = parseInt((req.query.limit as string) || "10");

  const wines = await db
    .select()
    .from(winesTable)
    .where(
      and(
        eq(winesTable.userId, userId),
        sql`${winesTable.drinkUntil} IS NOT NULL`,
        sql`${winesTable.quantity} > 0`
      )
    )
    .orderBy(winesTable.drinkUntil)
    .limit(limit);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = wines.map((w) => {
    const drinkDate = w.drinkUntil ? new Date(w.drinkUntil) : null;
    let daysUntilDeadline: number | null = null;
    let urgency: "overdue" | "critical" | "soon" | "ok" = "ok";

    if (drinkDate) {
      daysUntilDeadline = Math.floor(
        (drinkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilDeadline < 0) urgency = "overdue";
      else if (daysUntilDeadline <= 90) urgency = "critical";
      else if (daysUntilDeadline <= 180) urgency = "soon";
      else urgency = "ok";
    }

    return {
      ...w,
      pricePaid: w.pricePaid ? parseFloat(w.pricePaid) : null,
      daysUntilDeadline,
      urgency,
    };
  });

  return res.json(result);
});

// GET /wines/:id
router.get("/wines/:id", async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = user.id;
  const id = parseInt(routeParam(req.params.id));

  const [wine] = await db
    .select()
    .from(winesTable)
    .where(and(eq(winesTable.id, id), eq(winesTable.userId, userId)));

  if (!wine) return res.status(404).json({ error: "Wine not found" });

  return res.json({
    ...wine,
    pricePaid: wine.pricePaid ? parseFloat(wine.pricePaid) : null,
  });
});

// PATCH /wines/:id
router.patch("/wines/:id", async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = user.id;
  const id = parseInt(routeParam(req.params.id));

  const parsed = UpdateWineBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation error" });
  }

  const { pricePaid, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (pricePaid !== undefined) {
    updateData.pricePaid = pricePaid != null ? String(pricePaid) : null;
  }

  const [wine] = await db
    .update(winesTable)
    .set(updateData)
    .where(and(eq(winesTable.id, id), eq(winesTable.userId, userId)))
    .returning();

  if (!wine) return res.status(404).json({ error: "Wine not found" });

  return res.json({
    ...wine,
    pricePaid: wine.pricePaid ? parseFloat(wine.pricePaid) : null,
  });
});

// DELETE /wines/:id
router.delete("/wines/:id", async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = user.id;
  const id = parseInt(routeParam(req.params.id));

  const [wine] = await db
    .delete(winesTable)
    .where(and(eq(winesTable.id, id), eq(winesTable.userId, userId)))
    .returning();

  if (!wine) return res.status(404).json({ error: "Wine not found" });

  return res.status(204).send();
});

// POST /wines/:id/consume
router.post("/wines/:id/consume", async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = user.id;
  const wineId = parseInt(routeParam(req.params.id));

  const parsed = ConsumeWineBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation error" });
  }

  const [wine] = await db
    .select()
    .from(winesTable)
    .where(and(eq(winesTable.id, wineId), eq(winesTable.userId, userId)));

  if (!wine) return res.status(404).json({ error: "Wine not found" });

  const qty = parsed.data.quantity ?? 1;
  if (wine.quantity < qty) {
    return res.status(400).json({ error: "Insufficient stock" });
  }

  const consumption = await db.transaction(async (tx) => {
    const [updatedWine] = await tx
      .update(winesTable)
      .set({ quantity: sql`${winesTable.quantity} - ${qty}` })
      .where(
        and(
          eq(winesTable.id, wineId),
          eq(winesTable.userId, userId),
          sql`${winesTable.quantity} >= ${qty}`
        )
      )
      .returning();

    if (!updatedWine) {
      throw new Error("Insufficient stock");
    }

    const [record] = await tx
      .insert(consumptionTable)
      .values({
        wineId,
        userId,
        consumedAt: parsed.data.consumedAt,
        personalNote: parsed.data.personalNote,
        occasion: parsed.data.occasion,
        wouldBuyAgain: parsed.data.wouldBuyAgain,
        quantity: qty,
      })
      .returning();

    return record;
  }).catch((error) => {
    if (error instanceof Error && error.message === "Insufficient stock") {
      return null;
    }
    throw error;
  });

  if (!consumption) {
    return res.status(400).json({ error: "Insufficient stock" });
  }

  return res.status(201).json({
    ...consumption,
    wineName: wine.name,
    wineProducer: wine.producer,
    wineVintage: wine.vintage,
    labelPhotoUrl: wine.labelPhotoUrl,
  });
});

// POST /wines/:id/label
router.post("/wines/:id/label", async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = user.id;
  const id = parseInt(routeParam(req.params.id));

  const parsed = UploadWineLabelBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation error" });
  }

  const [wine] = await db
    .update(winesTable)
    .set({ labelPhotoUrl: parsed.data.labelPhotoUrl })
    .where(and(eq(winesTable.id, id), eq(winesTable.userId, userId)))
    .returning();

  if (!wine) return res.status(404).json({ error: "Wine not found" });

  return res.json({
    ...wine,
    pricePaid: wine.pricePaid ? parseFloat(wine.pricePaid) : null,
  });
});

export default router;
