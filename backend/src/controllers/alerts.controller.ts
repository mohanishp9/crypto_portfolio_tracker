import { Request, Response } from "express";
import PriceAlert from "../models/PriceAlert.model";
import { asyncHandler } from "../utils/asyncHandler";
import { priceAlertSchema, updatePriceAlertSchema } from "../utils/portfolioValidation";
import { getAlertsOverview } from "../services/portfolio.service";
import { getCurrentPrice } from "../services/coinGecko.service";

const ensureUserId = (req: Request) => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new Error("Not authenticated");
    }
    return userId;
};

export const getAlertsController = asyncHandler(async (req: Request, res: Response) => {
    const userId = ensureUserId(req);
    const result = await getAlertsOverview(userId);

    res.status(200).json({
        success: true,
        ...result,
    });
});

export const addAlertController = asyncHandler(async (req: Request, res: Response) => {
    const userId = ensureUserId(req);
    const payload = priceAlertSchema.parse(req.body);

    const currentPriceData = await getCurrentPrice([payload.coinId]);
    const currentPrice = currentPriceData.data[payload.coinId]?.usd;

    if (!currentPrice) {
        res.status(400);
        throw new Error("Could not fetch current price for validation");
    }

    if (payload.direction === "ABOVE" && payload.targetPrice <= currentPrice) {
        res.status(400);
        throw new Error("Target price must be above the current price");
    }
    if (payload.direction === "BELOW" && payload.targetPrice >= currentPrice) {
        res.status(400);
        throw new Error("Target price must be below the current price");
    }

    const alert = await PriceAlert.create({
        user: userId,
        ...payload,
        isActive: payload.isActive ?? true,
    });

    res.status(201).json({
        success: true,
        alert,
    });
});

export const updateAlertController = asyncHandler(async (req: Request, res: Response) => {
    const userId = ensureUserId(req);
    const payload = updatePriceAlertSchema.parse(req.body);

    // If both direction and targetPrice are present (or if we need to fetch the existing alert to compare, but here we can just fetch existing to validate if only one changed)
    const existingAlert = await PriceAlert.findOne({ _id: req.params.id, user: userId });
    if (!existingAlert) {
        res.status(404);
        throw new Error("Alert not found");
    }

    const newDirection = payload.direction ?? existingAlert.direction;
    const newTargetPrice = payload.targetPrice ?? existingAlert.targetPrice;
    
    // Only validate if we're actually changing direction or price and keeping it active
    if (payload.isActive !== false && (payload.direction || payload.targetPrice)) {
        const currentPriceData = await getCurrentPrice([existingAlert.coinId]);
        const currentPrice = currentPriceData.data[existingAlert.coinId]?.usd;

        if (!currentPrice) {
            res.status(400);
            throw new Error("Could not fetch current price for validation");
        }

        if (newDirection === "ABOVE" && newTargetPrice <= currentPrice) {
            res.status(400);
            throw new Error("Target price must be above the current price");
        }
        if (newDirection === "BELOW" && newTargetPrice >= currentPrice) {
            res.status(400);
            throw new Error("Target price must be below the current price");
        }
    }

    const alert = await PriceAlert.findOneAndUpdate(
        { _id: req.params.id, user: userId },
        payload,
        { new: true, runValidators: true }
    );

    if (!alert) {
        res.status(404);
        throw new Error("Alert not found");
    }

    res.status(200).json({
        success: true,
        alert,
    });
});

export const deleteAlertController = asyncHandler(async (req: Request, res: Response) => {
    const userId = ensureUserId(req);
    await PriceAlert.findOneAndDelete({ _id: req.params.id, user: userId });

    res.status(200).json({
        success: true,
        id: req.params.id,
    });
});
