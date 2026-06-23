import { pool } from "@workspace/db";

let billingSchemaReady: Promise<void> | null = null;

export async function ensureBillingSchema() {
  if (!billingSchemaReady) {
    billingSchemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS billing_subscriptions (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id varchar NOT NULL,
          user_email varchar,
          plan_id varchar NOT NULL,
          provider varchar NOT NULL DEFAULT 'mercado-pago',
          provider_subscription_id varchar UNIQUE,
          external_reference varchar UNIQUE,
          status varchar NOT NULL DEFAULT 'pending',
          provider_status varchar,
          checkout_url text,
          sandbox_checkout_url text,
          live_mode boolean,
          raw_payload jsonb,
          started_at timestamptz,
          next_payment_at timestamptz,
          canceled_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS billing_subscriptions_user_status_idx
        ON billing_subscriptions (user_id, status)
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS billing_subscriptions_provider_status_idx
        ON billing_subscriptions (provider_subscription_id, provider_status)
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS billing_webhook_events (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
          provider varchar NOT NULL DEFAULT 'mercado-pago',
          provider_event_id varchar,
          provider_topic varchar,
          provider_action varchar,
          provider_data_id varchar,
          provider_payload jsonb,
          processed_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS billing_webhook_events_data_idx
        ON billing_webhook_events (provider, provider_topic, provider_data_id)
      `);
    })();
  }

  return billingSchemaReady;
}
