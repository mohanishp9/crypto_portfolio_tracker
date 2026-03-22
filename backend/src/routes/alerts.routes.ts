import express from "express";
import { protect } from "../middleware/auth.middleware";
import {
    addAlertController,
    deleteAlertController,
    getAlertsController,
    updateAlertController,
} from "../controllers/alerts.controller";

const router = express.Router();

router.get("/", protect, getAlertsController);
router.post("/", protect, addAlertController);
router.patch("/:id", protect, updateAlertController);
router.delete("/:id", protect, deleteAlertController);

export default router;
