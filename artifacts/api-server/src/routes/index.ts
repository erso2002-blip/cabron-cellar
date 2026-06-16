import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import winesRouter from "./wines.js";
import consumptionRouter from "./consumption.js";
import dashboardRouter from "./dashboard.js";
import labelAnalyzerRouter from "./label-analyzer.js";
import suggestDrinkUntilRouter from "./suggest-drink-until.js";
import storageRouter from "./storage.js";
import wineInsightsRouter from "./wine-insights.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(winesRouter);
router.use(consumptionRouter);
router.use(dashboardRouter);
router.use(labelAnalyzerRouter);
router.use(suggestDrinkUntilRouter);
router.use(storageRouter);
router.use(wineInsightsRouter);

export default router;
