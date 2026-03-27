import {
  pgTable,
  text,
  integer,
  timestamp,
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingsTable = pgTable("bookings", {
  id:               text("id").primaryKey(),
  tenantId:         text("tenant_id"),                          // multi-tenant isolation (nullable for backward compat)
  assignedStaffId:  text("assigned_staff_id"),                  // staff member assigned to this job
  status:           text("status").notNull().default("draft"),
  serviceType:      text("service_type").notNull(),
  propertyType:     text("property_type").notNull(),
  bedrooms:         integer("bedrooms").notNull(),
  bathrooms:        integer("bathrooms").notNull(),
  extras:           json("extras").$type<string[]>().notNull().default([]),
  date:             text("date").notNull(),
  timeSlot:         text("time_slot").notNull(),
  addressLine1:     text("address_line1").notNull(),
  addressLine2:     text("address_line2"),
  suburb:           text("suburb").notNull(),
  state:            text("state").notNull(),
  postcode:         text("postcode").notNull(),
  firstName:        text("first_name").notNull(),
  lastName:         text("last_name").notNull(),
  email:            text("email").notNull(),
  phone:            text("phone").notNull(),
  notes:            text("notes"),
  quoteAmountCents: integer("quote_amount_cents").notNull().default(0),
  gstAmountCents:   integer("gst_amount_cents").notNull().default(0),
  currency:         text("currency").notNull().default("AUD"),
  stripeSessionId:  text("stripe_session_id"),
  stripePaymentId:  text("stripe_payment_id"),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
