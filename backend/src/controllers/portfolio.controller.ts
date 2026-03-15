import { asyncHandler } from "../utils/asyncHandler";
import Portfolio from "../models/Portfolio.model";
import { Request, Response } from "express";
import { getCurrentPrice, searchCoins } from "../services/coinGecko.service";
import { AddHoldingInput, UpdateHoldingInput, addHoldingSchema, updateHoldingSchema } from "../utils/portfolioValidation";

// @desc Get user Portfolio
// @route GET /api/portfolio
// @access Private
const getPortfolioController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        res.status(401);
        throw new Error("Not authenticated");
    }

    let portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) {
        portfolio = await Portfolio.create({
            user: req.user._id,
            holdings: [],
        });
    }

    res.status(200).json({
        success: true,
        portfolio,
    });
});

// @desc Add a holding to user Portfolio
// @route POST /api/portfolio/holdings
// @access Private
const addHoldingController = asyncHandler(async (req: Request, res: Response) => {
    const { coinId, coinName, coinSymbol, quantity, buyPrice } = addHoldingSchema.parse(req.body);

    if (!req.user) throw new Error("Not authenticated");

    let portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) {
        portfolio = await Portfolio.create({
            user: req.user._id,
            holdings: [],
        });
    }

    const existingIndex = portfolio.holdings.findIndex(h => h.coinId === coinId);

    if (existingIndex !== -1) {
        const holding = portfolio.holdings[existingIndex];
        const newQuantity = holding.quantity + quantity;

        if (newQuantity <= 0) {
            throw new Error("Resulting quantity cannot be zero or negative");
        }

        const oldTotalCost = holding.quantity * holding.buyPrice;
        const addedCost = quantity * buyPrice;
        const newTotalCost = oldTotalCost + addedCost;
        const newAvgPrice = newTotalCost / newQuantity;

        holding.quantity = newQuantity;
        holding.buyPrice = Number(newAvgPrice.toFixed(8));
        holding.purchaseDate = new Date();
    } else {
        // Add new
        portfolio.holdings.push({
            coinId,
            coinName,
            coinSymbol,
            quantity,
            buyPrice,
            purchaseDate: new Date(),
        });
    }

    await portfolio.save();

    res.status(existingIndex !== -1 ? 200 : 201).json({
        success: true,
        portfolio,
    });
});

// @desc Update a holding in user Portfolio
// @route PUT /api/portfolio/holdings/:holdingId
// @access Private
const updateHoldingController = asyncHandler(async (req: Request, res: Response) => {
    const { holdingId } = req.params;
    const validateData = updateHoldingSchema.parse(req.body);
    const { quantity, buyPrice }: UpdateHoldingInput = validateData;

    if (!req.user) {
        res.status(401);
        throw new Error("Not authenticated");
    }

    // Find user's portfolio
    const portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio) {
        res.status(404);
        throw new Error("Portfolio not found");
    }

    // Find holding inside holdings array
    const holding = portfolio.holdings.id(holdingId);

    if (!holding) {
        res.status(404);
        throw new Error("Holding not found");
    }

    // Update allowed fields
    if (quantity !== undefined) holding.quantity = quantity;
    if (buyPrice !== undefined) holding.buyPrice = buyPrice;

    // Save portfolio
    await portfolio.save();

    res.status(200).json({
        success: true,
        portfolio,
    });
});

// @desc Delete a holding from user Portfolio
// @route DELETE /api/portfolio/holdings/:holdingId
// @access Private
const deleteHoldingController = asyncHandler(async (req: Request, res: Response) => {
    const { holdingId } = req.params;

    if (!req.user) {
        res.status(401);
        throw new Error("Not authenticated");
    }

    const updatedPortfolio = await Portfolio.findOneAndUpdate(
        {
            user: req.user._id,
            "holdings._id": holdingId
        },
        {
            $pull: { holdings: { _id: holdingId } },
        },
        {
            new: true
        },
    );

    if (!updatedPortfolio) {
        res.status(404);
        throw new Error("Portfolio or Holding not found");
    }

    res.status(200).json({
        success: true,
        portfolio: updatedPortfolio,
    })
});

// @desc Get user Portfolio stats
// @route GET /api/portfolio/stats
// @access Private
const getPortfolioStatsController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        res.status(401);
        throw new Error("Not authenticated");
    }

    const portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio) {
        res.status(404);
        throw new Error("Portfolio not found");
    }

    if (portfolio.holdings.length === 0) {
        return res.status(200).json({
            success: true,
            totalInvestment: 0,
            currentValue: 0,
            profitLoss: 0,
            profitPercentage: 0,
        });
    }

    const coinIds = [...new Set(portfolio.holdings.map(h => h.coinId))];

    const coinsCurrentPrices = await getCurrentPrice(coinIds);

    const investment = portfolio.holdings.reduce((total, holding) => {
        return total + (holding.buyPrice * holding.quantity);
    }, 0);

    const currentValue = portfolio.holdings.reduce((total, holding) => {
        const priceData = coinsCurrentPrices[holding.coinId];

        if (!priceData) return total;

        return total + priceData.usd * holding.quantity;
    }, 0);

    const profitLoss = currentValue - investment;

    const profitPercentage = investment === 0 ? 0 : (profitLoss / investment) * 100;

    return res.status(200).json({
        success: true,
        investment,
        currentValue,
        profitLoss,
        profitPercentage,
        prices: coinsCurrentPrices,
    });
});

const searchCoinsController = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.query;
    const coins = await searchCoins(query as string);
    res.status(200).json({
        success: true,
        coins,
    });
});


export {
    getPortfolioController,
    addHoldingController,
    updateHoldingController,
    deleteHoldingController,
    getPortfolioStatsController,
    searchCoinsController,
}