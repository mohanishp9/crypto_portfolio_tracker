import express from "express";
import {
    getCoinDetailController,
    getTopCoinsController,
    getGlobalDataController,
    getCoinChartController,
} from "../controllers/market.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/top", getTopCoinsController);
router.get("/global", getGlobalDataController);
router.get("/chart/:coinId", getCoinChartController);
router.get("/coins/:coinId", protect, getCoinDetailController);

export default router;
