import { pool } from "@workspace/db";

let accountSchemaReady: Promise<void> | null = null;

export async function ensureAccountSchema() {
  if (!accountSchemaReady) {
    accountSchemaReady = (async () => {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone varchar`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notification_preferences (
          user_id varchar PRIMARY KEY,
          cellar_reminders boolean NOT NULL DEFAULT true,
          email_updates boolean NOT NULL DEFAULT true,
          product_updates boolean NOT NULL DEFAULT false,
          push_enabled boolean NOT NULL DEFAULT false,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS account_deletion_requests (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id varchar NOT NULL,
          email varchar,
          name varchar,
          status varchar NOT NULL DEFAULT 'pending',
          source varchar NOT NULL DEFAULT 'app',
          metadata jsonb,
          requested_at timestamptz NOT NULL DEFAULT now(),
          processed_at timestamptz
        )
      `);
    })();
  }

  return accountSchemaReady;
}
