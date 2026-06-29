import { asyncHandler } from "../utils/asyncHandler";
import { getCoinDetail, getTopCoins, getGlobalData, getCoinMarketChart } from "../services/coinGecko.service";
import { Request, Response } from "express";

export const getTopCoinsController = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const coins = await getTopCoins(limit);
    res.status(200).json({
        success: true,
        coins: coins.data,
        lastUpdated: coins.lastUpdated,
        stale: coins.stale,
        staleReason: coins.staleReason,
    });
});

export const getCoinDetailController = asyncHandler(async (req: Request, res: Response) => {
    const detail = await getCoinDetail(req.params.coinId);
    res.status(200).json({
        success: true,
        coin: detail.data,
        lastUpdated: detail.lastUpdated,
        stale: detail.stale,
        staleReason: detail.staleReason,
    });
});

export const getGlobalDataController = asyncHandler(async (_req: Request, res: Response) => {
    const globalData = await getGlobalData();
    res.status(200).json({
        success: true,
        data: globalData.data.data ?? globalData.data, // CoinGecko global data wraps content in data field.
        lastUpdated: globalData.lastUpdated,
        stale: globalData.stale,
        staleReason: globalData.staleReason,
    });
});

export const getCoinChartController = asyncHandler(async (req: Request, res: Response) => {
    const coinId = req.params.coinId;
    const days = parseInt(req.query.days as string) || 7;
    const chart = await getCoinMarketChart(coinId, days);
    res.status(200).json({
        success: true,
        prices: chart.data.prices, // We return the same structure expected by LandingPage: { prices: [...] }
        lastUpdated: chart.lastUpdated,
        stale: chart.stale,
        staleReason: chart.staleReason,
    });
});
