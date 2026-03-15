import express from "express";
import {
    getPortfolioController,
    addTransactionController,
    getPortfolioStatsController,
    deleteTransactionController,
    searchCoinsController,
} from "../controllers/portfolio.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/transactions", protect, addTransactionController);
router.get("/transactions", protect, getPortfolioController);
router.get("/stats", protect, getPortfolioStatsController);
router.delete("/transactions/:id", protect, deleteTransactionController);
router.get("/search", protect, searchCoinsController);

export default router;