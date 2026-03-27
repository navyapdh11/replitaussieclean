import { pgTable, text, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";

export const mlModelVersionsTable = pgTable("ml_model_versions", {
  id:                text("id").primaryKey(),
  tenantId:          text("tenant_id").notNull(),
  name:              text("name").notNull(),
  version:           text("version").notNull(),
  metrics:           json("metrics").$type<{ mae: number; rmse: number; r2: number }>().notNull().default({ mae: 0, rmse: 0, r2: 0 }),
  trainingDataCount: integer("training_data_count").notNull().default(0),
  coefficients:      json("coefficients").$type<number[]>(),
  intercept:         json("intercept").$type<number>(),
  featureNames:      json("feature_names").$type<string[]>().notNull().default([]),
  isActive:          boolean("is_active").notNull().default(false),
  trainedAt:         timestamp("trained_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt:         timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MLModelVersion = typeof mlModelVersionsTable.$inferSelect;
