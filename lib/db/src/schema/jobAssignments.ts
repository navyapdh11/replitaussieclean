import { pgTable, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { staffTable } from "./staff";

export const jobAssignmentsTable = pgTable("job_assignments", {
  id:                text("id").primaryKey(),
  bookingId:         text("booking_id").notNull().unique(),
  staffId:           text("staff_id").notNull().references(() => staffTable.id, { onDelete: "restrict" }),
  tenantId:          text("tenant_id").notNull(),
  status:            text("status").notNull().default("assigned"), // assigned | in_progress | completed | cancelled
  matchScore:        real("match_score").notNull().default(0),
  travelDistanceKm:  real("travel_distance_km"),
  travelTimeMin:     integer("travel_time_min"),
  assignedAt:        timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt:         timestamp("started_at", { withTimezone: true }),
  completedAt:       timestamp("completed_at", { withTimezone: true }),
  notes:             text("notes"),
});

export type JobAssignment = typeof jobAssignmentsTable.$inferSelect;
export type InsertJobAssignment = typeof jobAssignmentsTable.$inferInsert;
