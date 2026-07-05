import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "";

if (!REDIS_URL && process.env.NODE_ENV !== "test") {
    console.error("[Redis] FATAL ERROR: REDIS_URL is not set. Redis is a required dependency.");
    process.exit(1);
}

export const redis = new Redis(REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
        // Prevent infinite retry loops if Redis goes down. Retry up to 3 times.
        if (times > 3) {
            console.error("[Redis] FATAL ERROR: Disconnecting due to too many retries. Could not reach Redis.");
            if (process.env.NODE_ENV !== "test") {
                process.exit(1);
            }
            return null; // Stop retrying
        }
        return Math.min(times * 100, 3000); // Wait up to 3 seconds
    },
    // Prevent blocking user requests forever
    enableOfflineQueue: false,
    commandTimeout: 2000, 
});

redis.on("connect", () => {
    console.log("[Redis] Connected successfully to the cache.");
});

redis.on("error", (error) => {
    console.warn("[Redis] Connection error:", error.message);
});
