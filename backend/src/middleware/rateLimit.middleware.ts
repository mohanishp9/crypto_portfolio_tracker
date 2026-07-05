import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../config/redis";

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 authentication attempts per window
    message: {
        success: false,
        message: "Too many login/register attempts from this IP. Please try again after 15 minutes.",
    },
    standardHeaders: true, // Return rate limit info in standard headers
    legacyHeaders: false,
});

export const otpRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each (IP + email) to 5 OTP requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many OTP requests. Please try again after an hour.",
    },
    // Use Redis store if available
    store: redis ? new RedisStore({
        sendCommand: (...args: string[]) => redis!.call(args[0], ...args.slice(1)) as any,
        prefix: "rl:otp:"
    }) : undefined,
    // Group by IP and Email
    keyGenerator: (req) => {
        const email = req.body?.email || "no-email";
        return `${req.ip}_${email.toLowerCase()}`;
    }
});

export const globalApiRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // I set this to 100 to protect our shared CoinGecko budget from abuse
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests from this IP. Please try again later.",
    },
    store: redis ? new RedisStore({
        sendCommand: (...args: string[]) => redis!.call(args[0], ...args.slice(1)) as any,
        prefix: "rl:global:"
    }) : undefined,
});
