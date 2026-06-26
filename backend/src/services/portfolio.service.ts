import TransactionModel from "../models/Transaction.model";
import PriceAlert from "../models/PriceAlert.model";
import WatchlistItem from "../models/WatchlistItem.model";
import { getCurrentPrice } from "./coinGecko.service";
import { calculatePortfolio } from "./portfolioEngine.service";
import { PortfolioHoldingView, PortfolioStatsView, Transaction as PortfolioTransaction } from "../types/portfolio.types";
import { evaluateAlertsForUser } from "./alerts.service";
import { getPortfolioHistory, maybeCreateSnapshot } from "./snapshot.service";

const clampPercent = (value: number) => Number.isFinite(value) ? value : 0;

export const getUserTransactions = async (userId: string) => {
    return TransactionModel.find({ user: userId }).sort({ timestamp: 1 }).lean();
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

    const priceResponse = await getCurrentPrice(activeHoldings.map((holding) => holding.coinId));
    const totalCurrentValue = activeHoldings.reduce((sum, holding) => {
        const currentPrice = priceResponse.data[holding.coinId]?.usd ?? 0;
        return sum + holding.quantity * currentPrice;
    }, 0);

    const totalInvestment = activeHoldings.reduce((sum, holding) => sum + holding.totalCost, 0);

    const portfolio = activeHoldings.map((holding) => {
        const currentPrice = priceResponse.data[holding.coinId]?.usd ?? 0;
        const priceChange24h = priceResponse.data[holding.coinId]?.usd_24h_change ?? 0;
        const value = holding.quantity * currentPrice;
        const unrealizedProfit = value - holding.totalCost;
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

    const profitLoss = totalCurrentValue - totalInvestment;
    const profitPercentage = totalInvestment > 0 ? (profitLoss / totalInvestment) * 100 : 0;

    await maybeCreateSnapshot(userId, totalInvestment, totalCurrentValue, profitLoss);
    const triggeredAlerts = await evaluateAlertsForUser(userId, priceResponse.data);
    const chart = await getPortfolioHistory(userId);

    return {
        investment: totalInvestment,
        currentValue: totalCurrentValue,
        profitLoss,
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
