import axios from "axios";
import { CoinSearchResult, CoinSearchResponse, CoinPriceData, CoinPriceResponse, MarketCoin } from "../types/coinsData.types";


export const coinGeckoApi = axios.create({
    baseURL: "https://api.coingecko.com/api/v3",
    params: {
        x_cg_demo_api_key: process.env.COINGECKO_API_KEY,
    },
});

export const searchCoins = async (query: string): Promise<CoinSearchResult[]> => {
    try {
        if (!query || query.trim().length === 0) {
            return [];
        }

        const response = await coinGeckoApi.get<CoinSearchResponse>(
            "/search",
            {
                params: { query },
            }
        );

        return response.data.coins;
    } catch (error: any) {
        console.error("CoinGecko search error: ", error?.response?.data || error.message);
        throw new Error("Failed to search coins");
    }
};

export const getCurrentPrice = async (coinIds: string[]): Promise<CoinPriceResponse> => {
    try {
        const ids = coinIds.join(",");

        const response = await coinGeckoApi.get<CoinPriceResponse>(
            "/simple/price",
            {
                params: {
                    ids,
                    vs_currencies: "usd",
                    include_24hr_change: true,
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error fetching current prices: ", error);
        throw new Error("Failed to fetch coin prices");
    }
};

export const getTopCoin = async (limit: number): Promise<MarketCoin[]> => {
    try {
        const response = await coinGeckoApi.get<MarketCoin[]>(
            "/coins/markets",
            {
                params: {
                    vs_currency: "usd",
                    order: "market_cap_desc",
                    per_page: limit,
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error fetching top coins: ", error);
        throw new Error("Failed to fetch top coins");
    }
};