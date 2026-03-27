import { pgTable, text, real, json, timestamp } from "drizzle-orm/pg-core";

export const demandForecastsTable = pgTable("demand_forecasts", {
  id:               text("id").primaryKey(),
  tenantId:         text("tenant_id").notNull(),
  suburb:           text("suburb").notNull(),
  state:            text("state").notNull(),
  serviceType:      text("service_type").notNull(),
  forecastDate:     text("forecast_date").notNull(),  // YYYY-MM-DD
  predictedDemand:  real("predicted_demand").notNull(),
  confidenceLow:    real("confidence_low").notNull(),
  confidenceHigh:   real("confidence_high").notNull(),
  actualDemand:     real("actual_demand"),
  features:         json("features").$type<Record<string, number>>().notNull().default({}),
  modelVersion:     text("model_version").notNull(),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DemandForecast = typeof demandForecastsTable.$inferSelect;
