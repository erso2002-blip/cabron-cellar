import {
  consumptionTable,
  db,
  eq,
  sql,
  winesTable,
} from "@workspace/db";

const LEGACY_PUBLIC_USER_ID = "public-cabron-cellar";

export async function migrateLegacyCellarIfNeeded(userId: string) {
  const [{ count: ownWinesCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(winesTable)
    .where(eq(winesTable.userId, userId));

  if (ownWinesCount > 0) return;

  await db.transaction(async (tx) => {
    await tx
      .update(winesTable)
      .set({ userId, updatedAt: new Date() })
      .where(eq(winesTable.userId, LEGACY_PUBLIC_USER_ID));

    await tx
      .update(consumptionTable)
      .set({ userId })
      .where(eq(consumptionTable.userId, LEGACY_PUBLIC_USER_ID));
  });
}

export function canImportLegacyCellar(email: string) {
  const allowedEmails = (process.env.LEGACY_CELLAR_IMPORT_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(email.toLowerCase());
}
