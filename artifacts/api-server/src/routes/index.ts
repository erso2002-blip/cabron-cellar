import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import winesRouter from "./wines.js";
import consumptionRouter from "./consumption.js";
import dashboardRouter from "./dashboard.js";
import labelAnalyzerRouter from "./label-analyzer.js";
import suggestDrinkUntilRouter from "./suggest-drink-until.js";
import storageRouter from "./storage.js";
import wineInsightsRouter from "./wine-insights.js";
import waitlistRouter from "./waitlist.js";
import billingRouter from "./billing.js";

const router = Router();

router.use(healthRouter);
router.use(waitlistRouter);
router.use(authRouter);
router.use(billingRouter);
router.use(winesRouter);
router.use(consumptionRouter);
router.use(dashboardRouter);
router.use(labelAnalyzerRouter);
router.use(suggestDrinkUntilRouter);
router.use(wineInsightsRouter);
router.use(storageRouter);

export default router;
