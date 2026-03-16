import { asyncHandler } from "../utils/asyncHandler";
import Transaction from "../models/Transaction.model";
import { Request, Response } from "express";
import { getCurrentPrice, searchCoins } from "../services/coinGecko.service";
import { addTransactionSchema } from "../utils/portfolioValidation";
import { calculatePortfolio } from "../services/portfolioEngine.service";

// @desc Get user Portfolio
// @route GET /api/portfolio
// @access Private
const getPortfolioController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        res.status(401);
        throw new Error("Not authenticated");
    }

    let transactions = await Transaction.find({ user: req.user._id })
        .sort({ createdAt: 1 });

    res.status(200).json({
        success: true,
        transactions,
    });
});

// @desc Add a holding to user Portfolio
// @route POST /api/portfolio/holdings
// @access Private
const addTransactionController = asyncHandler(async (req: Request, res: Response) => {
    const { coinId, coinSymbol, coinName, type, quantity, price } = addTransactionSchema.parse(req.body);

    if (type === "SELL") {
        const transactions = await Transaction.find({ user: req.user?._id, coinId }).sort({ timestamp: 1 });

        const holdings = calculatePortfolio(transactions);

        const currentCoin = holdings[coinId];

        if (!currentCoin || currentCoin.quantity < quantity) {
            res.status(400);
            throw new Error(`Cannot sell ${quantity}. You only own ${currentCoin?.quantity || 0}`);
        }
    }

    const transaction = await Transaction.create({
        user: req.user?._id,
        coinId,
        coinSymbol,
        coinName,
        type,
        quantity,
        price,
    });

    res.status(201).json({
        success: true,
        transaction,
    });
});



// @desc Get user Portfolio stats
// @route GET /api/portfolio/stats
// @access Private
const getPortfolioStatsController = asyncHandler(async (req: Request, res: Response) => {
    const transactions = await Transaction.find({ user: req.user?._id })
        .sort({ timestamp: 1 });

    if (transactions.length === 0) {
        return res.json({ success: true, investment: 0, currentValue: 0, profitLoss: 0, profitPercentage: 0, portfolio: [] });
    }

    const holdings = calculatePortfolio(transactions);
    const coinIds = Object.keys(holdings);

    if (coinIds.length === 0) {
        return res.json({ success: true, investment: 0, currentValue: 0, profitLoss: 0, profitPercentage: 0, portfolio: [] });
    }

    const prices = await getCurrentPrice(coinIds);

    let totalInvestment = 0;
    let totalCurrentValue = 0;

    const portfolio = coinIds.map(id => {
        const coin = holdings[id];
        const currentPrice = prices[id]?.usd || 0;
        const value = coin.quantity * currentPrice;
        const unrealizedProfit = value - coin.totalCost;

        totalInvestment += coin.totalCost;
        totalCurrentValue += value;

        return {
            coinId: id,
            quantity: coin.quantity,
            totalCost: coin.totalCost,
            currentPrice,
            value,
            unrealizedProfit,
            realizedProfit: coin.realizedProfit,
        };
    }).filter(coin => coin.quantity > 0);

    const profitLoss = totalCurrentValue - totalInvestment;
    const profitPercentage = totalInvestment > 0 ? (profitLoss / totalInvestment) * 100 : 0;

    return res.json({
        success: true,
        investment: totalInvestment,
        currentValue: totalCurrentValue,
        profitLoss,
        profitPercentage,
        portfolio
    });
});

const deleteTransactionController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const transaction = await Transaction.findOneAndDelete({
        _id: id,
        user: req.user?._id,
    });

    if (!transaction) {
        res.status(404);
        throw new Error("Transaction not found");
    }

    res.status(200).json({ success: true, id });
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
    addTransactionController,
    getPortfolioStatsController,
    deleteTransactionController,
    searchCoinsController,
}