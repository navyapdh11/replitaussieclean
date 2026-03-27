import { Router, type IRouter } from "express";
import { GetQuoteBody, GetQuoteResponse } from "@workspace/api-zod";
import { calculateDynamicPrice } from "../lib/pricing";

const router: IRouter = Router();

router.post("/pricing/quote", async (req, res): Promise<void> => {
  const parsed = GetQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.errors });
    return;
  }

  const result = await calculateDynamicPrice({
    serviceType: parsed.data.serviceType,
    propertyType: parsed.data.propertyType,
    bedrooms: parsed.data.bedrooms,
    bathrooms: parsed.data.bathrooms,
    extras: parsed.data.extras ?? [],
    suburb: parsed.data.suburb,
    state: parsed.data.state,
    date: parsed.data.date,
    timeSlot: parsed.data.timeSlot,
  });

  res.json(GetQuoteResponse.parse(result));
});

export default router;
