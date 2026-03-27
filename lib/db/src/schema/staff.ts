import { pgTable, text, integer, real, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const staffTable = pgTable("staff", {
  id:             text("id").primaryKey(),
  tenantId:       text("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  name:           text("name").notNull(),
  email:          text("email").notNull(),
  phone:          text("phone").notNull(),
  role:           text("role").notNull().default("cleaner"),   // cleaner | supervisor | admin
  skills:         json("skills").$type<string[]>().notNull().default([]),
  maxJobsPerDay:  integer("max_jobs_per_day").notNull().default(3),
  baseSuburb:     text("base_suburb").notNull(),
  baseState:      text("base_state").notNull(),
  lat:            real("lat"),
  lng:            real("lng"),
  vehicleType:    text("vehicle_type").notNull().default("car"),
  rating:         real("rating").notNull().default(5.0),
  active:         boolean("active").notNull().default(true),
  notes:          text("notes"),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Staff = typeof staffTable.$inferSelect;
export type InsertStaff = typeof staffTable.$inferInsert;
