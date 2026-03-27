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

const router: IRouter = Router();

router.use(healthRouter);
router.use(bookingsRouter);
router.use(pricingRouter);
router.use(checkoutRouter);
router.use(serviceAreasRouter);
router.use(webhooksRouter);
router.use(aiRouter);
router.use(trackingRouter);
router.use(staffRouter);
router.use(mlRouter);
router.use(schedulingRouter);
router.use(tenantsRouter);
router.use("/pricing-factors", pricingFactorsRouter);

export default router;
