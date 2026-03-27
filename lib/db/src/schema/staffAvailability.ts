import { pgTable, text, json, timestamp, unique } from "drizzle-orm/pg-core";
import { staffTable } from "./staff";

export const staffAvailabilityTable = pgTable("staff_availability", {
  id:        text("id").primaryKey(),
  staffId:   text("staff_id").notNull().references(() => staffTable.id, { onDelete: "cascade" }),
  date:      text("date").notNull(),            // YYYY-MM-DD
  timeSlots: json("time_slots").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.staffId, t.date)]);

export type StaffAvailability = typeof staffAvailabilityTable.$inferSelect;
export type InsertStaffAvailability = typeof staffAvailabilityTable.$inferInsert;
