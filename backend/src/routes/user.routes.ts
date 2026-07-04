import express from "express";
import {
    checkNameController,
    updateNameController,
    changePasswordController,
    initiateEmailChangeController,
    verifyEmailChangeController,
    initiateAccountDeletionController,
    deleteAccountController
} from "../controllers/user.controller";
import { protect } from "../middleware/auth.middleware";
import { otpRateLimiter } from "../middleware/rateLimit.middleware";

const router = express.Router();

// Public check for name availability
router.get("/check-name", checkNameController);

// Protected routes
router.put("/name", protect, updateNameController);
router.put("/password", protect, changePasswordController);

// Email Change Flow
router.post("/email/initiate", protect, otpRateLimiter, initiateEmailChangeController);
router.put("/email/verify", protect, otpRateLimiter, verifyEmailChangeController);

// Account Deletion Flow
router.post("/delete/initiate", protect, otpRateLimiter, initiateAccountDeletionController);
router.delete("/", protect, otpRateLimiter, deleteAccountController);

export default router;
