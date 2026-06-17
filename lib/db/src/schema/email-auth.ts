import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const emailLoginCodesTable = pgTable(
  "email_login_codes",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailCreatedIdx: index("email_login_codes_email_created_idx").on(
      table.email,
      table.createdAt,
    ),
  }),
);

export const emailSessionsTable = pgTable(
  "email_sessions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex("email_sessions_token_hash_unique").on(
      table.tokenHash,
    ),
    userCreatedIdx: index("email_sessions_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
  }),
);

export type EmailLoginCode = typeof emailLoginCodesTable.$inferSelect;
export type EmailSession = typeof emailSessionsTable.$inferSelect;
