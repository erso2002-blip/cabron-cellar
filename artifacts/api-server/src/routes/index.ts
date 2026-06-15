import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import winesRouter from "./wines";
import consumptionRouter from "./consumption";
import dashboardRouter from "./dashboard";
import labelAnalyzerRouter from "./label-analyzer";
import suggestDrinkUntilRouter from "./suggest-drink-until";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(winesRouter);
router.use(consumptionRouter);
router.use(dashboardRouter);
router.use(labelAnalyzerRouter);
router.use(suggestDrinkUntilRouter);
router.use(storageRouter);

export default router;
