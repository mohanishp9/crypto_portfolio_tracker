import PriceAlert from "../models/PriceAlert.model";
import { CoinPriceResponse } from "../types/coinsData.types";

export const evaluateAlertsForUser = async (userId: string, prices: CoinPriceResponse) => {
    const alerts = await PriceAlert.find({ user: userId, isActive: true });
    const triggeredIds: string[] = [];

    for (const alert of alerts) {
        const currentPrice = prices[alert.coinId]?.usd;
        if (typeof currentPrice !== "number") {
            continue;
        }

        const shouldTrigger = alert.direction === "ABOVE"
            ? currentPrice >= alert.targetPrice
            : currentPrice <= alert.targetPrice;

        if (shouldTrigger && !alert.isTriggered) {
            alert.isTriggered = true;
            alert.lastTriggeredAt = new Date();
            await alert.save();
            triggeredIds.push(String(alert._id));
        } else if (!shouldTrigger && alert.isTriggered) {
            alert.isTriggered = false;
            await alert.save();
        }
    }

    return triggeredIds;
};
