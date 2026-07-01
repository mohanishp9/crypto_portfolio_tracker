import Redis from "ioredis";

// Log gracefully without crashing if REDIS_URL is not provided
const REDIS_URL = process.env.REDIS_URL || "";

export const redis = REDIS_URL ? new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
        // Prevent infinite retry loops if Redis goes down. Retry up to 3 times.
        if (times > 3) {
            console.warn("[Redis] Disconnecting due to too many retries.");
            return null; // Stop retrying
        }
        return Math.min(times * 100, 3000); // Wait up to 3 seconds
    },
    // Prevent blocking user requests forever
    enableOfflineQueue: false,
    commandTimeout: 2000, 
}) : null;

if (redis) {
    redis.on("connect", () => {
        console.log("[Redis] Connected successfully to the cache.");
    });

    redis.on("error", (error) => {
        console.warn("[Redis] Connection error:", error.message);
    });
} else {
    console.warn("[Redis] REDIS_URL not set. Running application without cache.");
}
