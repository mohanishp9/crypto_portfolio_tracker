import express from "express";
import {
    getPortfolioController,
    addTransactionController,
    getPortfolioStatsController,
    getPortfolioAnalyticsController,
    deleteTransactionController,
    exportTransactionsController,
    importTransactionsController,
    searchCoinsController,
    updateTransactionController,
} from "../controllers/portfolio.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/transactions", protect, addTransactionController);
router.get("/transactions", protect, getPortfolioController);
router.patch("/transactions/:id", protect, updateTransactionController);
router.get("/stats", protect, getPortfolioStatsController);
router.get("/analytics", protect, getPortfolioAnalyticsController);
router.delete("/transactions/:id", protect, deleteTransactionController);
router.get("/search", protect, searchCoinsController);
router.get("/export", protect, exportTransactionsController);
router.post("/import", protect, importTransactionsController);

export default router;
