import { Transaction, Holding } from "../types/portfolio.types";

export const calculatePortfolio = (transactions: Transaction[]) => {

    type HoldingsMap = Record<string, Holding>;
    const holdings: HoldingsMap = {};

    const EPSILON = 0.000001;

    for (const tx of transactions) {

        if (!holdings[tx.coinId]) {
            holdings[tx.coinId] = {
                coinId: tx.coinId,
                coinName: tx.coinName,
                coinSymbol: tx.coinSymbol,
                quantity: 0,
                totalCost: 0,
                realizedProfit: 0
            };
        }

        const coin = holdings[tx.coinId];

        if (tx.type === "BUY") {

            const cost = (tx.quantity * tx.price) + (tx.fee || 0);

            coin.quantity += tx.quantity;
            coin.totalCost += cost;
        }

        if (tx.type === "SELL") {

            // Prevent selling more than owned (with tolerance)
            if (coin.quantity + EPSILON < tx.quantity) {
                throw new Error("Cannot sell more than owned");
            }

            const avgPrice = coin.totalCost / coin.quantity;

            const costRemoved = avgPrice * tx.quantity;
            const sellRevenue = tx.quantity * tx.price;

            const profit = sellRevenue - costRemoved - (tx.fee || 0);

            coin.realizedProfit += profit;

            coin.quantity -= tx.quantity;
            coin.totalCost -= costRemoved;

            // Prevent floating point dust
            if (coin.quantity < EPSILON) {
                coin.quantity = 0;
                coin.totalCost = 0;
            }
        }
    }

    return holdings;
};
