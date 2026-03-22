import { Request, Response } from "express";
import PriceAlert from "../models/PriceAlert.model";
import { asyncHandler } from "../utils/asyncHandler";
import { priceAlertSchema, updatePriceAlertSchema } from "../utils/portfolioValidation";
import { getAlertsOverview } from "../services/portfolio.service";

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
