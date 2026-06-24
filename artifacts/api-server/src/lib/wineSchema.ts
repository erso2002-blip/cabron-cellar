import { pool } from "@workspace/db";

let wineSchemaReady: Promise<void> | null = null;

export async function ensureWineSchema() {
  if (!wineSchemaReady) {
    wineSchemaReady = (async () => {
      await pool.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS drink_until_source_url text`);
      await pool.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS drink_until_source_title text`);
      await pool.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS drink_until_source_type text`);
      await pool.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS drink_until_confidence text`);
      await pool.query(`ALTER TABLE wines ADD COLUMN IF NOT EXISTS drink_until_reason text`);
    })();
  }

  return wineSchemaReady;
}
