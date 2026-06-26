export interface CoinSearchResult {
    id: string;      // "bitcoin"
    name: string;    // "Bitcoin"
    symbol: string;  // "btc"
    thumb: string;   // icon URL
}

export interface TopCoin {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    price_change_percentage_24h: number;
    market_cap_rank: number;
    market_cap?: number;
}
