import express from "express";
import { protect } from "../middleware/auth.middleware";
import {
    addWatchlistItemController,
    deleteWatchlistItemController,
    getWatchlistController,
} from "../controllers/watchlist.controller";

const router = express.Router();

router.get("/", protect, getWatchlistController);
router.post("/", protect, addWatchlistItemController);
router.delete("/:coinId", protect, deleteWatchlistItemController);

export default router;
