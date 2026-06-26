import { Types } from "mongoose";

export interface ITransaction {
    _id?: Types.ObjectId | string;
    user?: Types.ObjectId;
    coinId: string;
    coinSymbol: string;
    coinName: string;
    type: "BUY" | "SELL";
    quantity: number;
    price: number;
    fee?: number;
    timestamp: Date;
}

export type TransactionType = "BUY" | "SELL";

export interface Transaction {
    _id?: string;
    coinName?: string;
    coinSymbol?: string;
    coinId: string;
    quantity: number;
    price: number;
    fee?: number;
    type: TransactionType;
    timestamp?: Date | string;
}

export interface Holding {
    coinId?: string;
    coinName?: string;
    coinSymbol?: string;
    quantity: number;
    totalCost: number;
    realizedProfit: number;
}

export interface PortfolioSnapshotPoint {
    _id?: string;
    investment: number;
    currentValue: number;
    profitLoss: number;
    capturedAt: Date;
}

export interface PortfolioHoldingView {
    coinId: string;
    coinName: string;
    coinSymbol: string;
    quantity: number;
    totalCost: number;
    avgBuyPrice: number;
    currentPrice: number;
    value: number;
    unrealizedProfit: number;
    realizedProfit: number;
    totalReturn: number;
    allocationPercent: number;
    priceChange24h: number;
}

export interface PortfolioStatsView {
    investment: number;
    currentValue: number;
    profitLoss: number;
    profitPercentage: number;
    portfolio: PortfolioHoldingView[];
    insights: {
        largestHolding?: PortfolioHoldingView | null;
        bestPerformer?: PortfolioHoldingView | null;
        worstPerformer?: PortfolioHoldingView | null;
        concentrationScore: number;
        topHoldingDominance: number;
    };
    chart: PortfolioSnapshotPoint[];
    lastUpdated: string | null;
    usedStalePrices: boolean;
    staleReason?: string;
    triggeredAlerts?: string[];
}
