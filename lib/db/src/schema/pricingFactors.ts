import {
  pgTable,
  text,
  real,
  boolean,
  timestamp,
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const dynamicPricingFactorsTable = pgTable("dynamic_pricing_factors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  label: text("label").notNull(),
  multiplier: real("multiplier").notNull().default(1.0),
  active: boolean("active").notNull().default(true),
  validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDynamicPricingFactorSchema = createInsertSchema(dynamicPricingFactorsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertDynamicPricingFactor = z.infer<typeof insertDynamicPricingFactorSchema>;
export type DynamicPricingFactor = typeof dynamicPricingFactorsTable.$inferSelect;
