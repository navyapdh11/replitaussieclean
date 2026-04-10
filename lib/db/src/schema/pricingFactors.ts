import {
  pgTable,
  text,
  real,
  boolean,
  timestamp,
  json,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const dynamicPricingFactorsTable = pgTable("dynamic_pricing_factors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  label: text("label").notNull(),
  multiplier: real("multiplier").notNull().default(1.0),
  active: boolean("active").notNull().default(true),
  validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
  metadata: json("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Manual schema to avoid drizzle-zod version mismatch
export const insertDynamicPricingFactorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  label: z.string().min(1),
  multiplier: z.number().default(1.0),
  active: z.boolean().default(true),
  validFrom: z.date(),
  validUntil: z.date(),
  metadata: z.record(z.unknown()).default({}),
});

export type InsertDynamicPricingFactor = z.infer<typeof insertDynamicPricingFactorSchema>;
export type DynamicPricingFactor = typeof dynamicPricingFactorsTable.$inferSelect;
