export interface CoinSearchResult {
    id: string; // "bitcoin"
    name: string; // "Bitcoin"
    symbol: string; // "btc"
    thumb: string; // icon URL
};

export interface CoinSearchResponse {
    coins: CoinSearchResult[];
};

export interface CoinPriceData {
    usd: number;
    usd_24h_change: number;
}

export interface CoinPriceResponse {
    [coinId: string]: CoinPriceData;
}

export interface MarketCoin {
    id: string;
    name: string;
    symbol: string;
    image: string;
    current_price: number;
    market_cap: number;
    price_change_percentage_24h: number;
}