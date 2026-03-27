import { Router, type IRouter } from "express";
import { db, serviceAreasTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListServiceAreasResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/service-areas", async (_req, res): Promise<void> => {
  const areas = await db
    .select()
    .from(serviceAreasTable)
    .where(eq(serviceAreasTable.active, true))
    .orderBy(serviceAreasTable.suburb);

  res.json(ListServiceAreasResponse.parse(areas));
});

export default router;
