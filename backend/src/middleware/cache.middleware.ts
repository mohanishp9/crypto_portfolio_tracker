import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis";

/**
 * Express middleware to cache responses in Redis.
 * Fail-open design: If Redis crashes, requests bypass the cache and hit the controller normally.
 * 
 * @param ttlSeconds - Time To Live (expiration) in seconds.
 */
export const cacheRoute = (ttlSeconds: number) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // If Redis is disabled or disconnected, skip caching completely
        if (!redis || redis.status !== "ready") {
            return next();
        }

        // Only cache GET requests
        if (req.method !== "GET") {
            return next();
        }

        // Add a project-specific prefix so it doesn't collide with your other Render projects!
        const cacheKey = `cyphersight:cache:${req.originalUrl || req.url}`;

        try {
            const cachedData = await redis!.get(cacheKey);

            if (cachedData) {
                return res.status(200).json(JSON.parse(cachedData));
            }

            // --- Cache Miss Handling ---
            // Monkey-patch the res.json method so we can capture the response from the controller
            // before it's sent to the client.
            const originalJson = res.json.bind(res);

            res.json = (body: any) => {
                // Only cache successful responses (status 200-299)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    // Fire-and-forget background save to Redis
                    redis!.set(cacheKey, JSON.stringify(body), "EX", ttlSeconds).catch(err => {
                        console.error(`[Redis] Failed to save key ${cacheKey}:`, err.message);
                    });
                }
                
                // Return the actual response to the user
                return originalJson(body);
            };

            next();
        } catch (error) {
            // Fail-open: If ioredis throws a timeout or error, just continue to the database/API
            console.warn(`[Redis] Cache fetch failed for ${cacheKey}, bypassing cache:`, (error as Error).message);
            next();
        }
    };
};
