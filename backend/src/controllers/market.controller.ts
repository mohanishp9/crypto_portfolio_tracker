import { asyncHandler } from "../utils/asyncHandler";
import { getTopCoins } from "../services/coinGecko.service";
import { Request, Response } from "express";

export const getTopCoinsController = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const coins = await getTopCoins(limit);
    res.status(200).json({
        success: true,
        coins,
    });
});