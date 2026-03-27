import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bookingsRouter from "./bookings";
import pricingRouter from "./pricing";
import checkoutRouter from "./checkout";
import serviceAreasRouter from "./serviceAreas";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bookingsRouter);
router.use(pricingRouter);
router.use(checkoutRouter);
router.use(serviceAreasRouter);

export default router;
