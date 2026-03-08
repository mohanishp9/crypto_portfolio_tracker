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
}

export interface AddHoldingInput {
    coinId: string;
    coinName: string;
    coinSymbol: string;
    quantity: number;
    buyPrice: number;
}

export interface UpdateHoldingInput {
    holdingId: string;
    quantity?: number;
    buyPrice?: number;
}

export type DeleteHoldingInput = string; // holdingId