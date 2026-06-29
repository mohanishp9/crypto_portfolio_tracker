import cron from "node-cron";
import { coinGeckoApi } from "./coinGecko.service";
import { setPersistentCache } from "./cache.service";
import { MarketCoin } from "../types/coinsData.types";
import { checkAndTriggerAllAlerts } from "./alerts.service";

const CHART_COINS = ["bitcoin", "ethereum", "binancecoin"];

export const refreshMarketDataCache = async (): Promise<void> => {
    console.log("[Cron] Starting market data cache refresh...");

    // 1. Fetch Top 100 Coins
    try {
        const response = await coinGeckoApi.get<MarketCoin[]>("/coins/markets", {
            params: {
                vs_currency: "usd",
                order: "market_cap_desc",
                per_page: 100,
                page: 1,
                sparkline: false,
            },
        });
        if (response.data && Array.isArray(response.data)) {
            await setPersistentCache("topCoins:100", response.data, {
                ttlMs: 300_000, // 5 min TTL
                staleTtlMs: 1000 * 60 * 60 * 6, // 6h stale grace
            });
            console.log("[Cron] Successfully cached Top 100 coins.");
        }
    } catch (error: any) {
        console.error("[Cron] Failed to fetch top coins:", error.message || error);
    }

    // 2. Fetch Global Market Data
    try {
        const response = await coinGeckoApi.get("/global");
        if (response.data) {
            await setPersistentCache("global", response.data, {
                ttlMs: 300_000, // 5 min TTL
                staleTtlMs: 1000 * 60 * 60 * 6,
            });
            console.log("[Cron] Successfully cached global market data.");
        }
    } catch (error: any) {
        console.error("[Cron] Failed to fetch global data:", error.message || error);
    }

    // 3. Fetch Market Charts for major coins
    for (const coinId of CHART_COINS) {
        try {
            const response = await coinGeckoApi.get(`/coins/${coinId}/market_chart`, {
                params: {
                    vs_currency: "usd",
                    days: 7,
                },
            });
            if (response.data) {
                await setPersistentCache(`marketChart:${coinId}:7`, response.data, {
                    ttlMs: 300_000, // 5 min TTL
                    staleTtlMs: 1000 * 60 * 60 * 6,
                });
                console.log(`[Cron] Successfully cached 7d market chart for ${coinId}.`);
            }
            // Add a small delay between requests to avoid hitting rate limits
            await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error: any) {
            console.error(`[Cron] Failed to fetch chart for ${coinId}:`, error.message || error);
        }
    }

    console.log("[Cron] Market data cache refresh complete.");
};

export const startCronJobs = (): void => {
    console.log("[Cron] Initializing cron scheduler...");
    
    // Schedule cache refresh and alerts check every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
        try {
            await refreshMarketDataCache();
            await checkAndTriggerAllAlerts();
        } catch (error) {
            console.error("[Cron] Error in cron execution tasks:", error);
        }
    });

    // Run cache refresh and alerts check immediately on startup in background
    refreshMarketDataCache().then(async () => {
        await checkAndTriggerAllAlerts();
    }).catch((err) => {
        console.error("[Cron] Error running initial market cache refresh & alert evaluation:", err);
    });
};
