import { pgTable, text, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const priceHistoryTable = pgTable("price_history", {
  id: text("id").primaryKey(),
  serviceType: text("service_type").notNull(),
  basePriceCents: integer("base_price_cents").notNull(),
  finalPriceCents: integer("final_price_cents").notNull(),
  dynamicMultiplier: text("dynamic_multiplier").notNull().default("1.0"),
  factorsApplied: json("factors_applied").$type<Record<string, number>>().notNull().default({}),
  bookingId: text("booking_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPriceHistorySchema = createInsertSchema(priceHistoryTable).omit({
  createdAt: true,
});
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type PriceHistory = typeof priceHistoryTable.$inferSelect;
