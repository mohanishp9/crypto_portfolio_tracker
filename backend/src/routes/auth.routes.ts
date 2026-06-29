import express from "express";
import {
    registerUserController,
    loginUserController,
    logoutUserController,
    getCurrentUserProfileController,
    refreshTokenController,
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rateLimit.middleware";

const router = express.Router();

router.post("/register", authRateLimiter, registerUserController);
router.post("/login", authRateLimiter, loginUserController);
router.post("/logout", logoutUserController); 
router.post("/refresh", refreshTokenController);
router.get("/me", protect, getCurrentUserProfileController);

export default router;