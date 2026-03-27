/**
 * Staff Scheduling Optimizer
 * ───────────────────────────
 * Greedy constraint-based matching that assigns unassigned bookings to
 * available staff for a given date.
 *
 * Composite score (0–100):
 *   50% proximity (haversine from staff base to job suburb)
 *   30% staff rating (1–5 → 0–30)
 *   20% workload balance (fewer existing assignments = better)
 */

import { db, bookingsTable, staffTable, staffAvailabilityTable, jobAssignmentsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import { logger } from "./logger";

/** Approximate lat/lng for Australian state capitals — used as fallback */
const STATE_LL: Record<string, [number, number]> = {
  NSW: [-33.8688, 151.2093], VIC: [-37.8136, 144.9631],
  QLD: [-27.4698, 153.0251], WA:  [-31.9505, 115.8605],
  SA:  [-34.9285, 138.6007], TAS: [-42.8821, 147.3272],
  ACT: [-35.2809, 149.1300], NT:  [-12.4634, 130.8456],
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SERVICE_DURATION: Record<string, number> = {
  standard_clean: 2.5, deep_clean: 4, end_of_lease: 5,
  office_clean: 3, carpet_clean: 3.5,
};

const REQUIRED_SKILLS: Record<string, string[]> = {
  end_of_lease: ["end_of_lease"],
  carpet_clean: ["carpet_clean"],
  office_clean:  ["office"],
};

function estimateDuration(serviceType: string, bedrooms: number, bathrooms: number): number {
  const base = SERVICE_DURATION[serviceType] ?? 2.5;
  return base + bedrooms * 0.4 + bathrooms * 0.3;
}

function requiredSkills(serviceType: string): string[] {
  return REQUIRED_SKILLS[serviceType] ?? [];
}

interface AssignmentResult {
  bookingId:         string;
  staffId:           string;
  staffName:         string;
  matchScore:        number;
  travelDistanceKm:  number;
  travelTimeMin:     number;
}

interface OptimizeResult {
  assignments: AssignmentResult[];
  skipped:     string[];
  stats: { total: number; assigned: number; unassigned: number };
}

export async function optimizeSchedule(tenantId: string, date: string): Promise<OptimizeResult> {
  logger.info({ tenantId, date }, "Running scheduling optimization");

  // 1. Fetch unassigned confirmed bookings for this date
  const unassigned = await db
    .select()
    .from(bookingsTable)
    .where(and(
      eq(bookingsTable.date, date),
      inArray(bookingsTable.status, ["confirmed", "pending"]),
    ));

  if (unassigned.length === 0) {
    return { assignments: [], skipped: [], stats: { total: 0, assigned: 0, unassigned: 0 } };
  }

  // Filter out already-assigned bookings
  const alreadyAssigned = await db
    .select({ bookingId: jobAssignmentsTable.bookingId })
    .from(jobAssignmentsTable)
    .where(inArray(
      jobAssignmentsTable.bookingId,
      unassigned.map((b) => b.id),
    ));

  const assignedIds = new Set(alreadyAssigned.map((a) => a.bookingId));
  const jobs = unassigned.filter((b) => !assignedIds.has(b.id));

  // 2. Fetch active staff for this tenant
  const staffList = await db
    .select()
    .from(staffTable)
    .where(and(
      eq(staffTable.tenantId, tenantId),
      eq(staffTable.active, true),
    ));

  // 3. Fetch availability for this date
  const avail = await db
    .select()
    .from(staffAvailabilityTable)
    .where(and(
      eq(staffAvailabilityTable.date, date),
      inArray(staffAvailabilityTable.staffId, staffList.map((s) => s.id)),
    ));
  const availMap = new Map(avail.map((a) => [a.staffId, a.timeSlots as string[]]));

  // 4. Count existing assignments per staff member for this date
  const existingAssignments = await db
    .select({ staffId: jobAssignmentsTable.staffId })
    .from(jobAssignmentsTable)
    .where(inArray(jobAssignmentsTable.staffId, staffList.map((s) => s.id)));
  const assignmentCount = new Map<string, number>();
  existingAssignments.forEach((a) => {
    assignmentCount.set(a.staffId, (assignmentCount.get(a.staffId) ?? 0) + 1);
  });

  const results: AssignmentResult[] = [];
  const skipped: string[] = [];

  for (const job of jobs) {
    const jLl: [number, number] = STATE_LL[job.state] ?? [-33.8688, 151.2093];
    const needed = requiredSkills(job.serviceType);

    const candidates = staffList.filter((staff) => {
      // Check max jobs per day
      const current = assignmentCount.get(staff.id) ?? 0;
      if (current >= staff.maxJobsPerDay) return false;
      // Check skills
      const staffSkills = (staff.skills as string[]) ?? [];
      if (needed.length > 0 && !needed.every((sk) => staffSkills.includes(sk))) return false;
      // Check availability (if set, must include job's time slot)
      const slots = availMap.get(staff.id);
      if (slots && slots.length > 0 && !slots.includes(job.timeSlot)) return false;
      return true;
    });

    if (candidates.length === 0) {
      logger.warn({ bookingId: job.id }, "No available staff for booking");
      skipped.push(job.id);
      continue;
    }

    // Score each candidate
    const scored = candidates.map((staff) => {
      const sLl: [number, number] = [
        staff.lat ?? (STATE_LL[staff.baseState]?.[0] ?? -33.8688),
        staff.lng ?? (STATE_LL[staff.baseState]?.[1] ?? 151.2093),
      ];
      const dist = haversineKm(sLl[0], sLl[1], jLl[0], jLl[1]);
      const distScore    = Math.max(0, 100 - dist * 3);    // closer = better (0–100)
      const ratingScore  = ((staff.rating ?? 5) / 5) * 30; // 0–30
      const current      = assignmentCount.get(staff.id) ?? 0;
      const loadScore    = (1 - current / staff.maxJobsPerDay) * 20; // 0–20
      return {
        staff,
        dist,
        score: distScore * 0.5 + ratingScore + loadScore,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const { staff: best, dist, score } = scored[0];

    // Create assignment record
    await db
      .insert(jobAssignmentsTable)
      .values({
        id:               randomUUID(),
        bookingId:        job.id,
        staffId:          best.id,
        tenantId,
        status:           "assigned",
        matchScore:       +score.toFixed(1),
        travelDistanceKm: +dist.toFixed(1),
        travelTimeMin:    Math.round((dist / 40) * 60), // assume 40 km/h avg
      })
      .onConflictDoNothing();

    // Update booking with assigned staff
    await db
      .update(bookingsTable)
      .set({ assignedStaffId: best.id })
      .where(eq(bookingsTable.id, job.id));

    // Update local count
    assignmentCount.set(best.id, (assignmentCount.get(best.id) ?? 0) + 1);

    results.push({
      bookingId:         job.id,
      staffId:           best.id,
      staffName:         best.name,
      matchScore:        +score.toFixed(1),
      travelDistanceKm:  +dist.toFixed(1),
      travelTimeMin:     Math.round((dist / 40) * 60),
    });
  }

  const stats = {
    total:      jobs.length,
    assigned:   results.length,
    unassigned: skipped.length,
  };

  logger.info(stats, "Scheduling optimization complete");
  return { assignments: results, skipped, stats };
}

export async function manualAssign(
  tenantId: string,
  bookingId: string,
  staffId: string,
): Promise<AssignmentResult> {
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
  const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, staffId));

  if (!booking || !staff) throw new Error("Booking or staff not found");

  const jLl: [number, number] = STATE_LL[booking.state] ?? [-33.8688, 151.2093];
  const sLl: [number, number] = [staff.lat ?? jLl[0], staff.lng ?? jLl[1]];
  const dist = haversineKm(sLl[0], sLl[1], jLl[0], jLl[1]);

  // Remove old assignment if any
  await db.delete(jobAssignmentsTable).where(eq(jobAssignmentsTable.bookingId, bookingId));

  await db.insert(jobAssignmentsTable).values({
    id:               randomUUID(),
    bookingId,
    staffId,
    tenantId,
    status:           "assigned",
    matchScore:       100,
    travelDistanceKm: +dist.toFixed(1),
    travelTimeMin:    Math.round((dist / 40) * 60),
  });

  await db.update(bookingsTable).set({ assignedStaffId: staffId }).where(eq(bookingsTable.id, bookingId));

  return {
    bookingId,
    staffId,
    staffName:         staff.name,
    matchScore:        100,
    travelDistanceKm:  +dist.toFixed(1),
    travelTimeMin:     Math.round((dist / 40) * 60),
  };
}
