import { pgTable, text, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const priceRulesTable = pgTable("price_rules", {
  id: text("id").primaryKey(),
  serviceType: text("service_type").notNull(),
  propertyType: text("property_type").notNull(),
  minPriceCents: integer("min_price_cents").notNull(),
  basePriceCents: integer("base_price_cents").notNull(),
  perBedroomCents: integer("per_bedroom_cents").notNull(),
  perBathroomCents: integer("per_bathroom_cents").notNull(),
  addonPriceCents: integer("addon_price_cents").notNull().default(1500),
  surchargeJson: json("surcharge_json").$type<Record<string, number>>().notNull().default({}),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPriceRuleSchema = createInsertSchema(priceRulesTable).omit({
  createdAt: true,
});
export type InsertPriceRule = z.infer<typeof insertPriceRuleSchema>;
export type PriceRule = typeof priceRulesTable.$inferSelect;
