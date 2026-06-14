import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import winesRouter from "./wines";
import consumptionRouter from "./consumption";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(winesRouter);
router.use(consumptionRouter);
router.use(dashboardRouter);

export default router;
