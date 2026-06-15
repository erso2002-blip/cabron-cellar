import {
  pgTable,
  text,
  serial,
  integer,
  numeric,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const winesTable = pgTable("wines", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  producer: text("producer").notNull(),
  country: text("country"),
  region: text("region"),
  grape: text("grape"),
  vintage: integer("vintage"),
  pricePaid: numeric("price_paid", { precision: 10, scale: 2 }),
  quantity: integer("quantity").notNull().default(1),
  cellarLocation: text("cellar_location"),
  locationPlace: text("location_place"),
  cellarName: text("cellar_name"),
  shelf: text("shelf"),
  drinkUntil: date("drink_until", { mode: "string" }),
  // AI-ready field: will be the source for automatic label reading in future integration
  labelPhotoUrl: text("label_photo_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertWineSchema = createInsertSchema(winesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWine = z.infer<typeof insertWineSchema>;
export type Wine = typeof winesTable.$inferSelect;
