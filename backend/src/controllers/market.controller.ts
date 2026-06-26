import { asyncHandler } from "../utils/asyncHandler";
import { getCoinDetail, getTopCoins } from "../services/coinGecko.service";
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
