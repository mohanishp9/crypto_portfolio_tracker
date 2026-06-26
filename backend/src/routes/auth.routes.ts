import express from "express";
import {
    registerUserController,
    loginUserController,
    logoutUserController,
    getCurrentUserProfileController,
    refreshTokenController,
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/register", registerUserController);
router.post("/login", loginUserController);
router.post("/logout", logoutUserController); 
router.post("/refresh", refreshTokenController);
router.get("/me", protect, getCurrentUserProfileController);

export default router;