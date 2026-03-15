import express from "express";
import { getTopCoinsController } from "../controllers/market.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/top", protect, getTopCoinsController);

export default router;