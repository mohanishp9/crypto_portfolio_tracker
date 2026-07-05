import axios from "axios";
import ApiCache from "../models/ApiCache.model";
import {
    CachedResponse,
    CoinDetail,
    CoinPriceResponse,
    CoinSearchResponse,
    CoinSearchResult,
    MarketCoin,
} from "../types/coinsData.types";
import { getCachedOrFetch, getPersistentCache } from "./cache.service";

const TTL = {
    prices: 60_000,
    topCoins: 120_000,
    search: 300_000,
    coinDetail: 300_000,
    global: 300_000,
    marketChart: 300_000,
    staleGrace: 1000 * 60 * 60 * 6,
};

export const coinGeckoApi = axios.create({
    baseURL: "https://api.coingecko.com/api/v3",
    params: {
        x_cg_demo_api_key: process.env.COINGECKO_API_KEY,
    },
    timeout: 10_000,
});

const normalizeError = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
            return "CoinGecko rate limit reached";
        }

        const apiError = error.response?.data as { error?: string } | undefined;
        return apiError?.error || error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Unknown CoinGecko error";
};

const toCachedResponse = <T>(
    payload: { data: T; lastUpdatedAt: Date; stale: boolean },
    staleReason?: string
): CachedResponse<T> => ({
    data: payload.data,
    lastUpdated: payload.lastUpdatedAt.toISOString(),
    stale: payload.stale,
    staleReason,
});

export const searchCoins = async (query: string): Promise<CachedResponse<CoinSearchResult[]>> => {
    if (!query || query.trim().length === 0) {
        return {
            data: [],
            lastUpdated: new Date(0).toISOString(),
            stale: false,
        };
    }

    const key = `search:${query.toLowerCase().trim()}`;

    try {
        const result = await getCachedOrFetch<CoinSearchResult[]>(
            key,
            { ttlMs: TTL.search, staleTtlMs: TTL.staleGrace },
            async () => {
                const response = await coinGeckoApi.get<CoinSearchResponse>("/search", {
                    params: { query },
                });
                return response.data.coins;
            }
        );

        return toCachedResponse(result);
    } catch (error: unknown) {
        console.error("CoinGecko search error:", normalizeError(error));
        throw new Error("Failed to search coins");
    }
};

export const getCurrentPrice = async (coinIds: string[]): Promise<CachedResponse<CoinPriceResponse>> => {
    const uniqueIds = [...new Set(coinIds.filter(Boolean))];
    if (uniqueIds.length === 0) {
        return {
            data: {},
            lastUpdated: new Date(0).toISOString(),
            stale: false,
        };
    }

    const key = `prices:${[...uniqueIds].sort().join(",")}`;
    
    // Fetch unconditional raw cache in case I need a last-resort fallback
    let rawCache: any = null;
    try {
        rawCache = await ApiCache.findOne({ key }).lean();
    } catch (e) {
        // Ignore DB errors here, I'll try the main flow
    }

    try {
        const result = await getCachedOrFetch<CoinPriceResponse>(
            key,
            { ttlMs: TTL.prices, staleTtlMs: TTL.staleGrace },
            async () => {
                const response = await coinGeckoApi.get<CoinPriceResponse>("/simple/price", {
                    params: {
                        ids: uniqueIds.join(","),
                        vs_currencies: "usd",
                        include_24hr_change: true,
                    },
                });
                return response.data;
            }
        );

        return toCachedResponse(
            result,
            result.stale ? "Showing cached prices because live market data is temporarily unavailable." : undefined
        );
    } catch (error: unknown) {
        if (rawCache) {
            console.warn(`[CoinGecko] Rate limit/error encountered. Serving stale cache for prices. Error: ${normalizeError(error)}`);
            return {
                data: rawCache.data as CoinPriceResponse,
                lastUpdated: new Date(rawCache.lastUpdatedAt).toISOString(),
                stale: true,
                staleReason: "CoinGecko is temporarily offline. Showing stale cached data.",
            };
        }
        console.error("Error fetching current prices:", normalizeError(error));
        throw new Error("Failed to fetch coin prices");
    }
};

export const getTopCoins = async (limit: number): Promise<CachedResponse<MarketCoin[]>> => {
    if (limit <= 100) {
        const cached100 = await getPersistentCache<MarketCoin[]>("topCoins:100");
        if (cached100 && !cached100.stale) {
            return {
                data: cached100.data.slice(0, limit),
                lastUpdated: cached100.lastUpdatedAt.toISOString(),
                stale: false,
            };
        }

        try {
            const result = await getCachedOrFetch<MarketCoin[]>(
                "topCoins:100",
                { ttlMs: TTL.topCoins, staleTtlMs: TTL.staleGrace },
                async () => {
                    const response = await coinGeckoApi.get<MarketCoin[]>("/coins/markets", {
                        params: {
                            vs_currency: "usd",
                            order: "market_cap_desc",
                            per_page: 100,
                            page: 1,
                            sparkline: false,
                        },
                    });
                    return response.data;
                }
            );

            return {
                data: result.data.slice(0, limit),
                lastUpdated: result.lastUpdatedAt.toISOString(),
                stale: result.stale,
            };
        } catch (error: unknown) {
            if (cached100) {
                return {
                    data: cached100.data.slice(0, limit),
                    lastUpdated: cached100.lastUpdatedAt.toISOString(),
                    stale: true,
                    staleReason: "CoinGecko is temporarily offline. Showing stale cached data.",
                };
            }
            console.error("Error fetching top coins:", normalizeError(error));
            throw new Error("Failed to fetch top coins");
        }
    }

    const key = `topCoins:${limit}`;

    try {
        const result = await getCachedOrFetch<MarketCoin[]>(
            key,
            { ttlMs: TTL.topCoins, staleTtlMs: TTL.staleGrace },
            async () => {
                const response = await coinGeckoApi.get<MarketCoin[]>("/coins/markets", {
                    params: {
                        vs_currency: "usd",
                        order: "market_cap_desc",
                        per_page: limit,
                        page: 1,
                        sparkline: false,
                    },
                });
                return response.data;
            }
        );

        return toCachedResponse(
            result,
            result.stale ? "Showing cached market leaders because CoinGecko is temporarily unavailable." : undefined
        );
    } catch (error: unknown) {
        console.error("Error fetching top coins:", normalizeError(error));
        throw new Error("Failed to fetch top coins");
    }
};

export const getCoinDetail = async (coinId: string): Promise<CachedResponse<CoinDetail>> => {
    const key = `coinDetail:${coinId}`;

    try {
        const result = await getCachedOrFetch<CoinDetail>(
            key,
            { ttlMs: TTL.coinDetail, staleTtlMs: TTL.staleGrace },
            async () => {
                const response = await coinGeckoApi.get(`/coins/${coinId}`, {
                    params: {
                        localization: false,
                        tickers: false,
                        market_data: true,
                        community_data: false,
                        developer_data: false,
                        sparkline: false,
                    },
                });

                const data = response.data;
                return {
                    id: data.id,
                    symbol: data.symbol,
                    name: data.name,
                    description: typeof data.description?.en === "string"
                        ? data.description.en.replace(/<[^>]*>/g, "").slice(0, 280)
                        : "",
                    image: data.image?.large || data.image?.small || "",
                    homepage: data.links?.homepage?.[0],
                    currentPrice: data.market_data?.current_price?.usd ?? 0,
                    priceChange24h: data.market_data?.price_change_percentage_24h ?? 0,
                    marketCapRank: data.market_cap_rank,
                    marketCap: data.market_data?.market_cap?.usd,
                    high24h: data.market_data?.high_24h?.usd,
                    low24h: data.market_data?.low_24h?.usd,
                };
            }
        );

        return toCachedResponse(
            result,
            result.stale ? "Showing cached coin detail because CoinGecko is temporarily unavailable." : undefined
        );
    } catch (error: unknown) {
        console.error("Error fetching coin detail:", normalizeError(error));
        throw new Error("Failed to fetch coin detail");
    }
};

export const getGlobalData = async (): Promise<CachedResponse<any>> => {
    const key = "global";

    try {
        const result = await getCachedOrFetch<any>(
            key,
            { ttlMs: TTL.global, staleTtlMs: TTL.staleGrace },
            async () => {
                const response = await coinGeckoApi.get("/global");
                return response.data;
            }
        );

        return toCachedResponse(
            result,
            result.stale ? "Showing cached global stats because CoinGecko is temporarily unavailable." : undefined
        );
    } catch (error: unknown) {
        console.error("Error fetching global data:", normalizeError(error));
        throw new Error("Failed to fetch global market data");
    }
};

export const getCoinMarketChart = async (coinId: string, days: number = 7): Promise<CachedResponse<any>> => {
    const key = `marketChart:${coinId}:${days}`;

    try {
        const result = await getCachedOrFetch<any>(
            key,
            { ttlMs: TTL.marketChart, staleTtlMs: TTL.staleGrace },
            async () => {
                const response = await coinGeckoApi.get(`/coins/${coinId}/market_chart`, {
                    params: {
                        vs_currency: "usd",
                        days,
                    },
                });
                return response.data;
            }
        );

        return toCachedResponse(
            result,
            result.stale ? "Showing cached chart data because CoinGecko is temporarily unavailable." : undefined
        );
    } catch (error: unknown) {
        console.error(`Error fetching market chart for ${coinId}:`, normalizeError(error));
        throw new Error(`Failed to fetch market chart for ${coinId}`);
    }
};
