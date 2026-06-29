import { rateLimit } from "express-rate-limit";

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 authentication attempts per window
    message: {
        success: false,
        message: "Too many login/register attempts from this IP. Please try again after 15 minutes.",
    },
    standardHeaders: true, // Return rate limit info in standard headers
    legacyHeaders: false, // Disable legacy headers
});
