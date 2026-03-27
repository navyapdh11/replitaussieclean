import { Router, type IRouter } from "express";
import { db, serviceAreasTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListServiceAreasResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/service-areas", async (_req, res): Promise<void> => {
  try {
    const areas = await db
      .select()
      .from(serviceAreasTable)
      .where(eq(serviceAreasTable.active, true))
      .orderBy(serviceAreasTable.suburb);

    res.json(ListServiceAreasResponse.parse(areas));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Query failed";
    res.status(500).json({ error: `Failed to fetch service areas: ${msg}` });
  }
});

export default router;
