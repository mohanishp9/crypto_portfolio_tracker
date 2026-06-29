import mongoose from "mongoose";
import TransactionModel from "../models/Transaction.model";
import PriceAlert from "../models/PriceAlert.model";
import WatchlistItem from "../models/WatchlistItem.model";
import { getCurrentPrice } from "./coinGecko.service";
import { calculatePortfolio } from "./portfolioEngine.service";
import { PortfolioHoldingView, PortfolioStatsView, Transaction as PortfolioTransaction } from "../types/portfolio.types";
import { evaluateAlertsForUser } from "./alerts.service";
import { getPortfolioHistory, maybeCreateSnapshot } from "./snapshot.service";

const clampPercent = (value: number) => Number.isFinite(value) ? value : 0;

export const getAllUserTransactions = async (userId: string) => {
    return TransactionModel.find({ user: userId }).sort({ timestamp: 1 }).lean();
};

export const getUserTransactions = async (
    userId: string,
    page: number = 1,
    limit: number = 10,
    search: string = ""
) => {
    const query: Record<string, any> = { user: userId };
    
    if (search.trim() !== "") {
        const regex = new RegExp(search.trim(), "i");
        query.$or = [
            { coinName: regex },
            { coinSymbol: regex },
        ];
    }

    const skip = (page - 1) * limit;
    const totalCount = await TransactionModel.countDocuments(query);
    const transactions = await TransactionModel.find(query)
        .sort({ timestamp: -1 }) // Newest first for paginated display
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        transactions,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
    };
};

export const validateTransactionTimeline = async (
    userId: string,
    nextTransaction: PortfolioTransaction,
    excludedTransactionId?: string
) => {
    const query: Record<string, unknown> = { user: userId };
    if (excludedTransactionId) {
        query._id = { $ne: excludedTransactionId };
    }

    const transactions = await TransactionModel.find(query).sort({ timestamp: 1 }).lean();
    const simulated = [...transactions, nextTransaction].sort((a, b) => {
        return new Date(a.timestamp ?? 0).getTime() - new Date(b.timestamp ?? 0).getTime();
    });

    calculatePortfolio(simulated as PortfolioTransaction[]);
};

export const validateTransactionSequence = (transactions: PortfolioTransaction[]) => {
    calculatePortfolio(
        [...transactions].sort((a, b) => {
            return new Date(a.timestamp ?? 0).getTime() - new Date(b.timestamp ?? 0).getTime();
        })
    );
};

const buildInsights = (portfolio: PortfolioHoldingView[]) => {
    const sortedByValue = [...portfolio].sort((a, b) => b.value - a.value);
    const sortedByReturn = [...portfolio].sort((a, b) => b.totalReturn - a.totalReturn);
    const topHoldingDominance = sortedByValue[0]?.allocationPercent ?? 0;
    const concentrationScore = Number(
        portfolio.reduce((sum, holding) => sum + Math.pow(holding.allocationPercent / 100, 2), 0).toFixed(4)
    );

    return {
        largestHolding: sortedByValue[0] ?? null,
        bestPerformer: sortedByReturn[0] ?? null,
        worstPerformer: sortedByReturn.at(-1) ?? null,
        concentrationScore,
        topHoldingDominance,
    };
};

export const getPortfolioStatsForUser = async (userId: string): Promise<PortfolioStatsView> => {
    const transactions = await TransactionModel.find({ user: userId }).sort({ timestamp: 1 }).lean();

    if (transactions.length === 0) {
        const chart = await getPortfolioHistory(userId);
        return {
            investment: 0,
            currentValue: 0,
            profitLoss: 0,
            profitPercentage: 0,
            portfolio: [],
            insights: {
                largestHolding: null,
                bestPerformer: null,
                worstPerformer: null,
                concentrationScore: 0,
                topHoldingDominance: 0,
            },
            chart,
            lastUpdated: null,
            usedStalePrices: false,
            triggeredAlerts: [],
        };
    }

    const holdings = calculatePortfolio(transactions as PortfolioTransaction[]);
    const totalRealizedProfit = Object.values(holdings).reduce((sum, h) => sum + (h.realizedProfit || 0), 0);

    const activeHoldings = Object.entries(holdings)
        .filter(([, holding]) => holding.quantity > 0)
        .map(([coinId, holding]) => ({
            coinId,
            ...holding,
        }));

    if (activeHoldings.length === 0) {
        const chart = await getPortfolioHistory(userId);
        return {
            investment: 0,
            currentValue: 0,
            profitLoss: totalRealizedProfit,
            realizedProfit: totalRealizedProfit,
            unrealizedProfit: 0,
            profitPercentage: 0,
            portfolio: [],
            insights: {
                largestHolding: null,
                bestPerformer: null,
                worstPerformer: null,
                concentrationScore: 0,
                topHoldingDominance: 0,
            },
            chart,
            lastUpdated: null,
            usedStalePrices: false,
            triggeredAlerts: [],
        };
    }

    const priceResponse = await getCurrentPrice(activeHoldings.map((holding) => holding.coinId));
    const totalCurrentValue = activeHoldings.reduce((sum, holding) => {
        const currentPrice = priceResponse.data[holding.coinId]?.usd ?? 0;
        return sum + holding.quantity * currentPrice;
    }, 0);

    const totalInvestment = activeHoldings.reduce((sum, holding) => sum + holding.totalCost, 0);

    let totalUnrealizedProfit = 0;
    const portfolio = activeHoldings.map((holding) => {
        const currentPrice = priceResponse.data[holding.coinId]?.usd ?? 0;
        const priceChange24h = priceResponse.data[holding.coinId]?.usd_24h_change ?? 0;
        const value = holding.quantity * currentPrice;
        const unrealizedProfit = value - holding.totalCost;
        totalUnrealizedProfit += unrealizedProfit;
        const totalReturn = holding.totalCost > 0 ? (unrealizedProfit / holding.totalCost) * 100 : 0;
        const avgBuyPrice = holding.quantity > 0 ? holding.totalCost / holding.quantity : 0;

        return {
            coinId: holding.coinId,
            coinName: holding.coinName || holding.coinId,
            coinSymbol: holding.coinSymbol || holding.coinId,
            quantity: holding.quantity,
            totalCost: holding.totalCost,
            avgBuyPrice,
            currentPrice,
            value,
            unrealizedProfit,
            realizedProfit: holding.realizedProfit,
            totalReturn,
            allocationPercent: totalCurrentValue > 0 ? clampPercent((value / totalCurrentValue) * 100) : 0,
            priceChange24h,
        };
    }).sort((a, b) => b.value - a.value);

    const netProfitLoss = totalUnrealizedProfit + totalRealizedProfit;
    const profitPercentage = totalInvestment > 0 ? (netProfitLoss / totalInvestment) * 100 : 0;

    await maybeCreateSnapshot(userId, totalInvestment, totalCurrentValue, netProfitLoss);
    const triggeredAlerts = await evaluateAlertsForUser(userId, priceResponse.data);
    const chart = await getPortfolioHistory(userId);

    return {
        investment: totalInvestment,
        currentValue: totalCurrentValue,
        profitLoss: netProfitLoss,
        realizedProfit: totalRealizedProfit,
        unrealizedProfit: totalUnrealizedProfit,
        profitPercentage,
        portfolio,
        insights: buildInsights(portfolio),
        chart,
        lastUpdated: priceResponse.lastUpdated,
        usedStalePrices: priceResponse.stale,
        staleReason: priceResponse.staleReason,
        triggeredAlerts,
    };
};

export const getWatchlistOverview = async (userId: string) => {
    const items = await WatchlistItem.find({ user: userId }).sort({ createdAt: -1 }).lean();
    if (items.length === 0) {
        return {
            items: [],
            lastUpdated: null,
            usedStalePrices: false,
        };
    }

    const prices = await getCurrentPrice(items.map((item) => item.coinId));
    return {
        items: items.map((item) => ({
            ...item,
            currentPrice: prices.data[item.coinId]?.usd ?? 0,
            priceChange24h: prices.data[item.coinId]?.usd_24h_change ?? 0,
        })),
        lastUpdated: prices.lastUpdated,
        usedStalePrices: prices.stale,
        staleReason: prices.staleReason,
    };
};

export const getAlertsOverview = async (userId: string) => {
    const alerts = await PriceAlert.find({ user: userId }).sort({ createdAt: -1 }).lean();
    if (alerts.length === 0) {
        return {
            alerts: [],
            lastUpdated: null,
            usedStalePrices: false,
        };
    }

    const prices = await getCurrentPrice(alerts.map((alert) => alert.coinId));
    return {
        alerts: alerts.map((alert) => ({
            ...alert,
            currentPrice: prices.data[alert.coinId]?.usd ?? 0,
        })),
        lastUpdated: prices.lastUpdated,
        usedStalePrices: prices.stale,
        staleReason: prices.staleReason,
    };
};

export const getPortfolioAnalyticsForUser = async (userId: string) => {
    const summary = await TransactionModel.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        { $sort: { timestamp: 1 } },
        {
            $group: {
                _id: "$coinId",
                coinName: { $first: "$coinName" },
                coinSymbol: { $first: "$coinSymbol" },
                totalBought: {
                    $sum: { $cond: [{ $eq: ["$type", "BUY"] }, "$quantity", 0] }
                },
                totalSold: {
                    $sum: { $cond: [{ $eq: ["$type", "SELL"] }, "$quantity", 0] }
                },
                totalBuyValue: {
                    $sum: { $cond: [{ $eq: ["$type", "BUY"] }, { $multiply: ["$quantity", "$price"] }, 0] }
                },
                totalSellValue: {
                    $sum: { $cond: [{ $eq: ["$type", "SELL"] }, { $multiply: ["$quantity", "$price"] }, 0] }
                },
                transactionCount: { $sum: 1 },
                firstTransaction: { $first: "$timestamp" },
                lastTransaction: { $last: "$timestamp" },
            }
        },
        {
            $project: {
                _id: 0,
                coinId: "$_id",
                coinName: 1,
                coinSymbol: 1,
                totalBought: 1,
                totalSold: 1,
                totalBuyValue: 1,
                totalSellValue: 1,
                netQuantity: { $subtract: ["$totalBought", "$totalSold"] },
                avgBuyPrice: {
                    $cond: [
                        { $gt: ["$totalBought", 0] },
                        { $divide: ["$totalBuyValue", "$totalBought"] },
                        0
                    ]
                },
                avgSellPrice: {
                    $cond: [
                        { $gt: ["$totalSold", 0] },
                        { $divide: ["$totalSellValue", "$totalSold"] },
                        0
                    ]
                },
                transactionCount: 1,
                firstTransaction: 1,
                lastTransaction: 1,
            }
        },
        { $sort: { coinName: 1 } }
    ]);

    return summary;
};
