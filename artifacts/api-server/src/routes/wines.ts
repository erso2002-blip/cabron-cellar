import { Router } from "express";
import { and, consumptionTable, db, desc, eq, ilike, or, sql, winesTable } from "@workspace/db";
import {
  CreateWineBody,
  UpdateWineBody,
  ConsumeWineBody,
  UploadWineLabelBody,
} from "@workspace/api-zod";
import { getAuthenticatedUser } from "../lib/auth.js";
import { getFreeBottleLimit, getPresentBottleCount, hasActiveProAccess } from "../lib/planAccess.js";
import { generateWineTemplate, validateWineRow } from "../lib/wineTemplate.js";
import ExcelJS from "exceljs";

const router = Router();
const MAX_LABEL_PHOTO_URL_LENGTH = 6_800_000;

const STRING_LIMITS: Record<string, number> = {
  name: 160,
  producer: 160,
  wineryWebsiteUrl: 300,
  country: 80,
  region: 120,
  grape: 160,
  cellarLocation: 120,
  locationPlace: 120,
  cellarName: 120,
  shelf: 80,
  notes: 2_000,
  labelPhotoUrl: MAX_LABEL_PHOTO_URL_LENGTH,
  additionalPhotoUrl: MAX_LABEL_PHOTO_URL_LENGTH,
};

function routeParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function invalidId(value: number) {
  return !Number.isInteger(value) || value <= 0;
}

function parsePositiveInteger(value: string) {
  if (!/^\d+$/.test(value)) return NaN;
  return Number(value);
}

function invalidWinePayload(data: Record<string, unknown>) {
  for (const [field, max] of Object.entries(STRING_LIMITS)) {
    const value = data[field];
    if (typeof value === "string" && value.length > max) {
      return true;
    }
  }

  if ("quantity" in data && (!Number.isInteger(data.quantity) || (data.quantity as number) < 0)) {
    return true;
  }

  if ("vintage" in data && data.vintage != null) {
    const vintage = data.vintage as number;
    const maxVintage = new Date().getFullYear() + 1;
    if (!Number.isInteger(vintage) || vintage < 1800 || vintage > maxVintage) {
      return true;
    }
  }

  if ("pricePaid" in data && data.pricePaid != null && (data.pricePaid as number) < 0) {
    return true;
  }

  return false;
}

function bottleLimitError(limit: number) {
  return {
    error: "Free bottle limit exceeded",
    limit,
    upgradeRequired: true,
  };
}

// GET /wines/template — serve the Excel import template
router.get("/wines/template", async (req: any, res: any) => {
  try {
    const buffer = await generateWineTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="template-vinhos.xlsx"');
    res.setHeader("Content-Length", buffer.length);
    return res.send(buffer);
  } catch (error) {
    console.error("Error generating template:", error);
    return res.status(500).json({ error: "Failed to generate template" });
  }
});

// POST /wines/import — import wines from Excel file
router.post("/wines/import", async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = user.id;

  // Expect base64-encoded Excel file in request body
  const { fileData } = req.body;
  if (!fileData || typeof fileData !== "string") {
    return res.status(400).json({ error: "fileData is required and must be a base64 string" });
  }

  try {
    // Decode base64 and create buffer
    const buffer = Buffer.from(fileData, "base64");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    // Get the first worksheet
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ error: "No worksheet found in the uploaded file" });
    }

    const expectedHeaders = [
      "Nome do Vinho",
      "Produtor",
      "Safra",
      "Tipo",
      "País/Região",
      "Preço",
      "Website",
      "Estoque",
      "Notas"
    ];

    // Validate headers
    const headerRow = worksheet.getRow(1);
    const actualHeaders = (headerRow.values as any) || [];
    
    if (!actualHeaders || actualHeaders.length < expectedHeaders.length) {
      return res.status(400).json({ 
        error: "Invalid template structure. Expected headers: " + expectedHeaders.join(", ")
      });
    }

    // Compare headers (case-sensitive)
    const headerMismatch = expectedHeaders.some((expected, index) => {
      return actualHeaders[index + 1] !== expected; // +1 because ExcelJS uses 1-based indexing
    });

    if (headerMismatch) {
      return res.status(400).json({ 
        error: "Template headers don't match. Please use the official template.",
        expectedHeaders,
        actualHeaders: actualHeaders.slice(1, expectedHeaders.length + 1)
      });
    }

    // Process rows
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
      wines: [] as any[]
    };

    const maxRows = 1000;
    const dataSummary: { [key: string]: number } = {};

    for (let rowNum = 2; rowNum <= (worksheet.rowCount || 1000) && rowNum <= maxRows + 1; rowNum++) {
      const row = worksheet.getRow(rowNum);
      const rowData = (row.values as any[]) || [];

      // Skip empty rows
      if (!rowData || rowData.length < 2) continue;

      // Convert row to object with headers
      const rowObj: Record<string, any> = {};
      expectedHeaders.forEach((header, index) => {
        rowObj[header] = rowData[index + 1];
      });

      // Validate row
      const validation = validateWineRow(rowObj as any, rowNum);

      if (!validation.valid) {
        results.failed++;
        results.errors.push(...validation.errors);
      } else if (validation.data) {
        // Check plan limits
        if (!(await hasActiveProAccess(user))) {
          const limit = getFreeBottleLimit();
          const currentBottles = await getPresentBottleCount(userId);
          const nextBottles = currentBottles + (validation.data.quantity || 1);
          if (nextBottles > limit) {
            results.failed++;
            results.errors.push(
              `Linha ${rowNum}: Limite de garrafas gratuitas (${limit}) seria excedido. Atualize para PRO para continuar.`
            );
            continue;
          }
        }

        try {
          // Ensure data has required fields (name and producer are already validated)
          if (!validation.data.name || !validation.data.producer) {
            results.failed++;
            results.errors.push(`Linha ${rowNum}: Dados inválidos - Nome e Produtor são obrigatórios`);
            continue;
          }

          const wineInsertData = {
            name: validation.data.name,
            producer: validation.data.producer,
            userId,
            vintage: validation.data.vintage,
            grape: validation.data.grape,
            country: validation.data.country,
            region: validation.data.region,
            quantity: validation.data.quantity || 1,
            pricePaid: validation.data.pricePaid,
            wineryWebsiteUrl: validation.data.wineryWebsiteUrl,
            notes: validation.data.notes
          };

          const [wine] = await db
            .insert(winesTable)
            .values(wineInsertData as any)
            .returning();

          results.successful++;
          results.wines.push({
            id: wine.id,
            name: wine.name,
            producer: wine.producer,
            vintage: wine.vintage,
            quantity: wine.quantity
          });
          dataSummary[wine.name] = (dataSummary[wine.name] || 0) + 1;
        } catch (dbError) {
          results.failed++;
          results.errors.push(`Linha ${rowNum}: Erro ao inserir no banco de dados`);
        }
      }
    }

    if (results.successful + results.failed === 0) {
      return res.status(400).json({ error: "No valid wine data found in the file" });
    }

    return res.status(200).json({
      message: `Importação concluída: ${results.successful} vinhos importados, ${results.failed} com erro`,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors,
      wines: results.wines.slice(0, 10) // Return first 10 for preview
    });
  } catch (error) {
    console.error("Error processing import:", error);
    return res.status(500).json({ error: "Failed to process the uploaded file" });
  }
});

// GET /wines
router.get("/wines", async (req: any, res: any) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = user.id;
  const { search, country, region, grape, vintage, minQuantity } = req.query as Record<string, string>;
  if ([search, country, region, grape].some((value) => value && value.length > 160)) {
    return res.status(400).json({ error: "Invalid query" });
  }

  const conditions = [eq(winesTable.userId, userId)];

  if (search) {
    conditions.push(
      or(
        ilike(winesTable.name, `%${search}%`),
        ilike(winesTable.producer, `%${search}%`),
        ilike(winesTable.wineryWebsiteUrl, `%${search}%`),
        ilike(winesTable.grape, `%${search}%`),
        ilike(winesTable.country, `%${search}%`),
        ilike(winesTable.region, `%${search}%`)
      )!
    );
  }
  if (country) conditions.push(ilike(winesTable.country, `%${country}%`));
  if (region) conditions.push(ilike(winesTable.region, `%${region}%`));
  if (grape) conditions.push(ilike(winesTable.grape, `%${grape}%`));
  if (vintage) {
    const parsedVintage = parsePositiveInteger(vintage);
    if (invalidId(parsedVintage)) return res.status(400).json({ error: "Invalid query" });
    conditions.push(eq(winesTable.vintage, parsedVintage));
  }
  if (minQuantity) {
    const parsedMinQuantity = parsePositiveInteger(minQuantity);
    if (!Number.isInteger(parsedMinQuantity) || parsedMinQuantity < 0) {
      return res.status(400).json({ error: "Invalid query" });
    }
    conditions.push(sql`${winesTable.quantity} >= ${parsedMinQuantity}`);
  }

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
  if (invalidWinePayload(parsed.data)) {
    return res.status(400).json({ error: "Validation error" });
  }

  const { pricePaid, ...rest } = parsed.data;
  if (!(await hasActiveProAccess(user))) {
    const limit = getFreeBottleLimit();
    const currentBottles = await getPresentBottleCount(userId);
    const nextBottles = currentBottles + parsed.data.quantity;
    if (nextBottles > limit) {
      return res.status(402).json(bottleLimitError(limit));
    }
  }

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
  const limit = parsePositiveInteger((req.query.limit as string) || "10");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ error: "Invalid query" });
  }

  const wines = await db
    .select()
    .from(winesTable)
    .where(
      and(
        eq(winesTable.userId, userId),
        sql`${winesTable.drinkUntil} IS NOT NULL`,
        sql`${winesTable.drinkUntil} <= CURRENT_DATE + INTERVAL '12 months'`,
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
      else if (daysUntilDeadline <= 365) urgency = "soon";
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
  const id = parsePositiveInteger(routeParam(req.params.id));
  if (invalidId(id)) return res.status(400).json({ error: "Invalid wine id" });

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
  const id = parsePositiveInteger(routeParam(req.params.id));
  if (invalidId(id)) return res.status(400).json({ error: "Invalid wine id" });

  const parsed = UpdateWineBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation error" });
  }
  if (invalidWinePayload(parsed.data)) {
    return res.status(400).json({ error: "Validation error" });
  }

  const { pricePaid, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (pricePaid !== undefined) {
    updateData.pricePaid = pricePaid != null ? String(pricePaid) : null;
  }

  if (!(await hasActiveProAccess(user)) && parsed.data.quantity !== undefined) {
    const [currentWine] = await db
      .select({ quantity: winesTable.quantity })
      .from(winesTable)
      .where(and(eq(winesTable.id, id), eq(winesTable.userId, userId)));

    if (!currentWine) return res.status(404).json({ error: "Wine not found" });

    const limit = getFreeBottleLimit();
    const currentBottles = await getPresentBottleCount(userId);
    const nextBottles = currentBottles - currentWine.quantity + parsed.data.quantity;
    if (nextBottles > limit) {
      return res.status(402).json(bottleLimitError(limit));
    }
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
  const id = parsePositiveInteger(routeParam(req.params.id));
  if (invalidId(id)) return res.status(400).json({ error: "Invalid wine id" });

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
  const wineId = parsePositiveInteger(routeParam(req.params.id));
  if (invalidId(wineId)) return res.status(400).json({ error: "Invalid wine id" });

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
  if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
    return res.status(400).json({ error: "Invalid quantity" });
  }
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
  const id = parsePositiveInteger(routeParam(req.params.id));
  if (invalidId(id)) return res.status(400).json({ error: "Invalid wine id" });

  const parsed = UploadWineLabelBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation error" });
  }
  if (parsed.data.labelPhotoUrl.length > MAX_LABEL_PHOTO_URL_LENGTH) {
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
