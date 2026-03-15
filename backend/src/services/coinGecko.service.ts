import axios from "axios";
import { CoinSearchResult, CoinSearchResponse, CoinPriceData, CoinPriceResponse, MarketCoin } from "../types/coinsData.types";

// ── Simple in-memory cache ──────────────────────────────
const cache = new Map<string, { data: any; expiresAt: number }>();

function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.data as T;
}

function setCached(key: string, data: any, ttlMs: number) {
    cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

const TTL = {
    prices: 60_000,
    topCoins: 120_000,
    search: 300_000,
};

export const coinGeckoApi = axios.create({
    baseURL: "https://api.coingecko.com/api/v3",
    params: {
        x_cg_demo_api_key: process.env.COINGECKO_API_KEY,
    },
});

export const searchCoins = async (query: string): Promise<CoinSearchResult[]> => {
    if (!query || query.trim().length === 0) return [];

    const key = `search:${query.toLowerCase().trim()}`;
    const cached = getCached<CoinSearchResult[]>(key);
    if (cached) return cached;                          // ← hit cache, skip API

    try {
        const response = await coinGeckoApi.get<CoinSearchResponse>("/search", {
            params: { query },
        });
        setCached(key, response.data.coins, TTL.search);  // ← store
        return response.data.coins;
    } catch (error: any) {
        console.error("CoinGecko search error: ", error?.response?.data || error.message);
        throw new Error("Failed to search coins");
    }
};

export const getCurrentPrice = async (coinIds: string[]): Promise<CoinPriceResponse> => {
    const key = `prices:${[...coinIds].sort().join(",")}`;
    const cached = getCached<CoinPriceResponse>(key);
    if (cached) return cached;                          // ← hit cache, skip API

    try {
        const response = await coinGeckoApi.get<CoinPriceResponse>("/simple/price", {
            params: {
                ids: coinIds.join(","),
                vs_currencies: "usd",
                include_24hr_change: true,
            },
        });
        setCached(key, response.data, TTL.prices);        // ← store
        return response.data;
    } catch (error) {
        console.error("Error fetching current prices: ", error);
        throw new Error("Failed to fetch coin prices");
    }
};

export const getTopCoins = async (limit: number): Promise<MarketCoin[]> => {
    const key = `topCoins:${limit}`;
    const cached = getCached<MarketCoin[]>(key);
    if (cached) return cached;                          // ← hit cache, skip API

    try {
        const response = await coinGeckoApi.get<MarketCoin[]>("/coins/markets", {
            params: {
                vs_currency: "usd",
                order: "market_cap_desc",
                per_page: limit,
            },
        });
        setCached(key, response.data, TTL.topCoins);      // ← store
        return response.data;
    } catch (error) {
        console.error("Error fetching top coins: ", error);
        throw new Error("Failed to fetch top coins");
    }
};