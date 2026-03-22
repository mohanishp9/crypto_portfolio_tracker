import express from "express";
import { getCoinDetailController, getTopCoinsController } from "../controllers/market.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/top", protect, getTopCoinsController);
router.get("/coins/:coinId", protect, getCoinDetailController);

export default router;
