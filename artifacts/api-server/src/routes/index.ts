import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bookingsRouter from "./bookings";
import pricingRouter from "./pricing";
import checkoutRouter from "./checkout";
import serviceAreasRouter from "./serviceAreas";
import webhooksRouter from "./webhooks";
import aiRouter from "./ai";
import trackingRouter from "./tracking";
import staffRouter from "./staff";
import mlRouter from "./ml";
import schedulingRouter from "./scheduling";
import tenantsRouter from "./tenants";
import { pricingFactorsRouter } from "./pricingFactors";
import adminSystemRouter from "./adminSystem";
import docsRouter from "./docs";
import analyticsRouter from "./analytics";
import { adminLimiter } from "../lib/ratelimit";

const router: IRouter = Router();

router.use(healthRouter);
router.use(docsRouter);
router.use(bookingsRouter);
router.use(pricingRouter);
router.use(checkoutRouter);
router.use(serviceAreasRouter);
router.use(webhooksRouter);
router.use(aiRouter);
router.use(trackingRouter);

/* ── Admin-scoped routes: stricter rate limit ─────────────────────────── */
router.use(adminLimiter, analyticsRouter);
router.use(adminLimiter, staffRouter);
router.use(adminLimiter, mlRouter);
router.use(adminLimiter, schedulingRouter);
router.use(adminLimiter, adminSystemRouter);
router.use("/pricing-factors", adminLimiter, pricingFactorsRouter);

/* ── Tenant routes: public branding + admin management ───────────────── */
router.use(tenantsRouter);

export default router;
