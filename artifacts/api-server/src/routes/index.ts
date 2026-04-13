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
import contactRouter from "./contact";
import reviewsRouter from "./reviews";
import { adminLimiter } from "../lib/ratelimit";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Auth middleware for admin endpoints (permissive in dev without ADMIN_API_KEY)
const adminAuth = requireAuth(["admin"]);

router.use(healthRouter);
router.use(docsRouter);
router.use(bookingsRouter);
router.use(pricingRouter);
router.use(checkoutRouter);
router.use(serviceAreasRouter);
router.use(webhooksRouter);
router.use(aiRouter);
router.use(trackingRouter);
router.use(contactRouter);
router.use(reviewsRouter);

/* ── Admin-scoped routes: auth + stricter rate limit ─────────────────── */
router.use(adminAuth, adminLimiter, analyticsRouter);
router.use(adminAuth, adminLimiter, staffRouter);
router.use(adminAuth, adminLimiter, mlRouter);
router.use(adminAuth, adminLimiter, schedulingRouter);
router.use(adminAuth, adminLimiter, adminSystemRouter);
router.use("/pricing-factors", adminAuth, adminLimiter, pricingFactorsRouter);

/* ── Tenant routes: public branding + admin management ───────────────── */
router.use(tenantsRouter);

export default router;
