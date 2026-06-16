import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { winesTable } from "./wines.js";

export const consumptionTable = pgTable("consumption", {
  id: serial("id").primaryKey(),
  wineId: integer("wine_id")
    .notNull()
    .references(() => winesTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  consumedAt: date("consumed_at", { mode: "string" }).notNull(),
  personalNote: text("personal_note"),
  occasion: text("occasion"),
  wouldBuyAgain: boolean("would_buy_again"),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertConsumptionSchema = createInsertSchema(consumptionTable).omit({
  id: true,
  createdAt: true,
});

export type InsertConsumption = z.infer<typeof insertConsumptionSchema>;
export type Consumption = typeof consumptionTable.$inferSelect;
