import { pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const waitlistLeadsTable = pgTable(
  "waitlist_leads",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    whatsapp: text("whatsapp"),
    source: text("source").notNull().default("waitlist"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("waitlist_leads_email_unique").on(table.email),
  }),
);

export const insertWaitlistLeadSchema = createInsertSchema(waitlistLeadsTable)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(180).transform((value) => value.toLowerCase()),
    whatsapp: z.string().trim().max(40).optional().nullable(),
    source: z.string().trim().min(1).max(80).optional(),
    notes: z.string().trim().max(500).optional().nullable(),
  });

export type InsertWaitlistLead = z.infer<typeof insertWaitlistLeadSchema>;
export type WaitlistLead = typeof waitlistLeadsTable.$inferSelect;
