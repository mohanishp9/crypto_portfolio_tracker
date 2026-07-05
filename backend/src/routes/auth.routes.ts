import express from "express";
import {
    initiateRegistrationController,
    verifyRegistrationController,
    loginUserController,
    logoutUserController,
    getCurrentUserProfileController,
    refreshTokenController,
    initiatePasswordResetController,
    verifyPasswordResetController,
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import { authRateLimiter, otpRateLimiter } from "../middleware/rateLimit.middleware";

const router = express.Router();

router.post("/register/initiate", otpRateLimiter, initiateRegistrationController);
router.post("/register/verify", authRateLimiter, verifyRegistrationController);
router.post("/login", authRateLimiter, loginUserController);
router.post("/logout", logoutUserController); 
router.post("/refresh", refreshTokenController);
router.post("/password-reset/initiate", otpRateLimiter, initiatePasswordResetController);
router.post("/password-reset/verify", authRateLimiter, verifyPasswordResetController);
router.get("/me", protect, getCurrentUserProfileController);

export default router;