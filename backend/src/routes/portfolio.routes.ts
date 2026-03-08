import express from "express";
import {
    getPortfolioController,
    addHoldingController,
    updateHoldingController,
    deleteHoldingController,
    getPortfolioStatsController,
    searchCoinsController,
} from "../controllers/portfolio.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/", protect, getPortfolioController);
router.post("/holdings", protect, addHoldingController);
router.put("/holdings/:holdingId", protect, updateHoldingController);
router.delete("/holdings/:holdingId", protect, deleteHoldingController);
router.get("/stats", protect, getPortfolioStatsController);
router.get("/search", protect, searchCoinsController);

export default router;