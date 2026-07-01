import express from "express";
import {
    getCoinDetailController,
    getTopCoinsController,
    getGlobalDataController,
    getCoinChartController,
} from "../controllers/market.controller";
import { protect } from "../middleware/auth.middleware";

import { cacheRoute } from "../middleware/cache.middleware";

const router = express.Router();

router.get("/top", cacheRoute(300), getTopCoinsController);
router.get("/global", cacheRoute(300), getGlobalDataController);
router.get("/chart/:coinId", cacheRoute(900), getCoinChartController);
router.get("/coins/:coinId", protect, cacheRoute(300), getCoinDetailController);

export default router;
