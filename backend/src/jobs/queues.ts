import { Queue } from "bullmq";
import Redis from "ioredis";

// Use same Redis URL as caching, or separate if provided
const REDIS_URL = process.env.REDIS_URL || "";

// We need a dedicated ioredis instance for BullMQ
export const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
});

// Initialize Alert Queue
export const alertQueue = new Queue("alertQueue", {
    connection: connection as any,
    defaultJobOptions: {
        attempts: 3, // Retry 3 times
        backoff: {
            type: "exponential",
            delay: 5000, // 5s, 10s, 20s
        },
        removeOnComplete: true, // Keep Redis clean
        removeOnFail: 100, // Keep last 100 failed jobs for debugging
    },
});
