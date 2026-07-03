import Transaction from "../models/Transaction.model";

export interface TaxEvent {
    asset: string;
    sellDate: string;
    buyDate: string;
    quantity: number;
    proceeds: number;
    costBasis: number;
    realizedGain: number;
    term: "SHORT" | "LONG";
}

interface BuyLot {
    quantity: number;
    price: number;
    fee: number;
    date: Date;
}

export interface TaxReportData {
    events: TaxEvent[];
    summary: {
        totalProceeds: number;
        totalCostBasis: number;
        totalGain: number;
        totalShortTerm: number;
        totalLongTerm: number;
    };
    csv: string;
}

export const generateTaxReport = async (userId: string, targetYear?: number): Promise<TaxReportData> => {
    // Fetch all transactions for the user, ascending order
    const transactions = await Transaction.find({ user: userId }).sort({ timestamp: 1 });

    const holdings: Record<string, BuyLot[]> = {};
    const taxEvents: TaxEvent[] = [];

    for (const tx of transactions) {
        const coin = tx.coinSymbol.toUpperCase();
        if (!holdings[coin]) {
            holdings[coin] = [];
        }

        if (tx.type === "BUY") {
            holdings[coin].push({
                quantity: tx.quantity,
                price: tx.price,
                fee: tx.fee || 0,
                date: tx.timestamp,
            });
        } else if (tx.type === "SELL") {
            let remainingToSell = tx.quantity;
            let currentSellFee = tx.fee || 0;

            const buyQueue = holdings[coin];

            while (remainingToSell > 0 && buyQueue.length > 0) {
                const oldestBuy = buyQueue[0];
                const amountFromLot = Math.min(remainingToSell, oldestBuy.quantity);

                // Calculate ratios
                const proportionOfBuy = amountFromLot / oldestBuy.quantity;
                const proportionOfSell = amountFromLot / tx.quantity;

                const chunkBuyFee = oldestBuy.fee * proportionOfBuy;
                const chunkSellFee = currentSellFee * proportionOfSell;

                const costBasis = (amountFromLot * oldestBuy.price) + chunkBuyFee;
                const proceeds = (amountFromLot * tx.price) - chunkSellFee;
                const realizedGain = proceeds - costBasis;

                const holdingMs = tx.timestamp.getTime() - oldestBuy.date.getTime();
                const term = holdingMs > 365 * 24 * 60 * 60 * 1000 ? "LONG" : "SHORT";

                // Only record the event if it falls within the target year (if specified)
                const sellYear = tx.timestamp.getFullYear();
                if (!targetYear || sellYear === targetYear) {
                    taxEvents.push({
                        asset: coin,
                        sellDate: tx.timestamp.toISOString(),
                        buyDate: oldestBuy.date.toISOString(),
                        quantity: amountFromLot,
                        proceeds,
                        costBasis,
                        realizedGain,
                        term,
                    });
                }

                // Update the lot and remaining to sell
                oldestBuy.quantity -= amountFromLot;
                oldestBuy.fee -= chunkBuyFee;
                remainingToSell -= amountFromLot;

                // Remove the lot if fully depleted
                if (oldestBuy.quantity <= 0.00000001) { // Floating point precision safeguard
                    buyQueue.shift();
                }
            }

            if (remainingToSell > 0.00000001) {
                throw new Error(`Data corruption: Insufficient buy history to match sell quantity for ${coin}. Missing ${remainingToSell} ${coin}.`);
            }
        }
    }

    let totalProceeds = 0;
    let totalCostBasis = 0;
    let totalGain = 0;
    let totalShortTerm = 0;
    let totalLongTerm = 0;

    // Generate CSV
    let csv = "Asset,Sell Date,Buy Date,Quantity,Proceeds (USD),Cost Basis (USD),Gain/Loss (USD),Term\n";
    for (const event of taxEvents) {
        totalProceeds += event.proceeds;
        totalCostBasis += event.costBasis;
        totalGain += event.realizedGain;
        if (event.term === "SHORT") totalShortTerm += event.realizedGain;
        if (event.term === "LONG") totalLongTerm += event.realizedGain;

        csv += `${event.asset},${event.sellDate},${event.buyDate},${event.quantity.toFixed(8)},${event.proceeds.toFixed(2)},${event.costBasis.toFixed(2)},${event.realizedGain.toFixed(2)},${event.term}\n`;
    }

    csv += `\n,,,TOTALS:,${totalProceeds.toFixed(2)},${totalCostBasis.toFixed(2)},${totalGain.toFixed(2)},\n`;
    csv += `\n,,,SHORT TERM GAIN:,,,,${totalShortTerm.toFixed(2)}\n`;
    csv += `,,,LONG TERM GAIN:,,,,${totalLongTerm.toFixed(2)}\n`;

    return {
        events: taxEvents,
        summary: {
            totalProceeds,
            totalCostBasis,
            totalGain,
            totalShortTerm,
            totalLongTerm
        },
        csv
    };
};
