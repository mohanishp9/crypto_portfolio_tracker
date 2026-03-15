// Typescript Interface
export interface Holding {
    _id: string;
    coinId: string;
    coinName: string;
    coinSymbol: string;
    quantity: number;
    buyPrice: number;
    purchaseDate: Date;
};

export interface Portfolio {
    _id: string;
    user: string;
    holdings: Holding[];
    createdAt: string;
    updatedAt: string;
}

export interface GetPortfolioResponse {
    success: boolean;
    portfolio: Portfolio;
}

export interface PortfolioMutationResponse {
    success: boolean;
    portfolio: Portfolio;
}

interface CoinPrice {
    usd: number;
}

type CoinPriceMap = Record<string, CoinPrice>;


export interface PortfolioStatsResponse {
    success: boolean;
    investment: number;
    currentValue: number;
    profitLoss: number;
    profitPercentage: number;
    prices: CoinPriceMap;
    portfolio: any[];
}

export interface AddTransactionInput {
    coinId: string;
    coinName: string;
    coinSymbol: string;
    quantity: number;
    price: number;
    fee?: number;
    type: TransactionType;
}

export type TransactionType = "BUY" | "SELL";

export interface Transaction {
    coinId: string;
    quantity: number;
    price: number;
    fee?: number;
    type: TransactionType;
}