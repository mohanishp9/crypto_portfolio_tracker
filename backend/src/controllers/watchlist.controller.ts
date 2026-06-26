import { Request, Response } from "express";
import WatchlistItem from "../models/WatchlistItem.model";
import { asyncHandler } from "../utils/asyncHandler";
import { watchlistItemSchema } from "../utils/portfolioValidation";
import { getWatchlistOverview } from "../services/portfolio.service";

const ensureUserId = (req: Request) => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new Error("Not authenticated");
    }
    return userId;
};

export const getWatchlistController = asyncHandler(async (req: Request, res: Response) => {
    const userId = ensureUserId(req);
    const watchlist = await getWatchlistOverview(userId);

    res.status(200).json({
        success: true,
        ...watchlist,
    });
});

export const addWatchlistItemController = asyncHandler(async (req: Request, res: Response) => {
    const userId = ensureUserId(req);
    const payload = watchlistItemSchema.parse(req.body);

    const item = await WatchlistItem.findOneAndUpdate(
        { user: userId, coinId: payload.coinId },
        { user: userId, ...payload },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
        success: true,
        item,
    });
});

export const deleteWatchlistItemController = asyncHandler(async (req: Request, res: Response) => {
    const userId = ensureUserId(req);
    await WatchlistItem.findOneAndDelete({ user: userId, coinId: req.params.coinId });

    res.status(200).json({
        success: true,
        coinId: req.params.coinId,
    });
});
