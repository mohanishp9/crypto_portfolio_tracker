export type TransactionType = "BUY" | "SELL";
export type AlertDirection = "ABOVE" | "BELOW";

export interface Transaction {
    _id: string;
    coinId: string;
    coinName: string;
    coinSymbol: string;
    quantity: number;
    price: number;
    fee?: number;
    type: TransactionType;
    timestamp: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface HoldingStat {
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

export interface InsightHolding extends HoldingStat {}

export interface PortfolioInsight {
    largestHolding: InsightHolding | null;
    bestPerformer: InsightHolding | null;
    worstPerformer: InsightHolding | null;
    concentrationScore: number;
    topHoldingDominance: number;
}

export interface PortfolioChartPoint {
    _id?: string;
    investment: number;
    currentValue: number;
    profitLoss: number;
    capturedAt: string;
}

export interface PortfolioStatsResponse {
    success: boolean;
    investment: number;
    currentValue: number;
    profitLoss: number;
    profitPercentage: number;
    portfolio: HoldingStat[];
    insights: PortfolioInsight;
    chart: PortfolioChartPoint[];
    lastUpdated: string | null;
    usedStalePrices: boolean;
    staleReason?: string;
    triggeredAlerts?: string[];
}

export interface AddTransactionInput {
    coinId: string;
    coinName: string;
    coinSymbol: string;
    quantity: number;
    price: number;
    fee?: number;
    type: TransactionType;
    timestamp?: string;
}

export interface PortfolioMutationResponse {
    success: boolean;
    transaction?: Transaction;
    id?: string;
    count?: number;
}

export interface TransactionsResponse {
    success: boolean;
    transactions: Transaction[];
}

export interface WatchlistItem {
    _id: string;
    coinId: string;
    coinName: string;
    coinSymbol: string;
    currentPrice: number;
    priceChange24h: number;
    createdAt: string;
}

export interface WatchlistResponse {
    success: boolean;
    items: WatchlistItem[];
    lastUpdated: string | null;
    usedStalePrices: boolean;
    staleReason?: string;
}

export interface PriceAlert {
    _id: string;
    coinId: string;
    coinName: string;
    coinSymbol: string;
    direction: AlertDirection;
    targetPrice: number;
    currentPrice: number;
    isActive: boolean;
    isTriggered: boolean;
    lastTriggeredAt?: string | null;
    createdAt?: string;
}

export interface AlertsResponse {
    success: boolean;
    alerts: PriceAlert[];
    lastUpdated: string | null;
    usedStalePrices: boolean;
    staleReason?: string;
}

export interface AddWatchlistItemInput {
    coinId: string;
    coinName: string;
    coinSymbol: string;
}

export interface AddAlertInput extends AddWatchlistItemInput {
    direction: AlertDirection;
    targetPrice: number;
    isActive?: boolean;
}

export interface CoinDetail {
    id: string;
    symbol: string;
    name: string;
    description: string;
    image: string;
    homepage?: string;
    currentPrice: number;
    priceChange24h: number;
    marketCapRank?: number;
    marketCap?: number;
    high24h?: number;
    low24h?: number;
}

export interface CoinDetailResponse {
    success: boolean;
    coin: CoinDetail;
    lastUpdated: string;
    stale: boolean;
    staleReason?: string;
}
