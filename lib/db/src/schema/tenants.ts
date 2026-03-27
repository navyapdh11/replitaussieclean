import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const tenantsTable = pgTable("tenants", {
  id:             text("id").primaryKey(),
  name:           text("name").notNull(),
  slug:           text("slug").notNull().unique(),
  domain:         text("domain").unique(),
  logo:           text("logo"),
  primaryColor:   text("primary_color").notNull().default("#22d3ee"),
  secondaryColor: text("secondary_color").notNull().default("#0f172a"),
  abn:            text("abn"),
  phone:          text("phone"),
  email:          text("email"),
  plan:           text("plan").notNull().default("starter"),  // starter | pro | enterprise
  active:         boolean("active").notNull().default(true),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Tenant = typeof tenantsTable.$inferSelect;
export type InsertTenant = typeof tenantsTable.$inferInsert;
