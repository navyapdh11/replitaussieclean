import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const serviceAreasTable = pgTable("service_areas", {
  id: text("id").primaryKey(),
  suburb: text("suburb").notNull(),
  state: text("state").notNull(),
  postcode: text("postcode").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertServiceAreaSchema = createInsertSchema(serviceAreasTable).omit({
  createdAt: true,
});
export type InsertServiceArea = z.infer<typeof insertServiceAreaSchema>;
export type ServiceArea = typeof serviceAreasTable.$inferSelect;
