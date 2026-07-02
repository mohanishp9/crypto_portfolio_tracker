import PriceAlert from "../models/PriceAlert.model";
import { CoinPriceResponse } from "../types/coinsData.types";
import { getCurrentPrice } from "./coinGecko.service";
import { IUser } from "../types/user.types";
import { alertQueue } from "../jobs/queues";

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

export const checkAndTriggerAllAlerts = async () => {
    console.log("[Alerts Worker] Checking active price alerts...");
    try {
        const activeAlerts = await PriceAlert.find({ isActive: true }).populate<{ user: IUser }>("user");
        if (activeAlerts.length === 0) {
            console.log("[Alerts Worker] No active alerts to check.");
            return;
        }

        const coinIds = [...new Set(activeAlerts.map(a => a.coinId))];
        const priceResponse = await getCurrentPrice(coinIds);

        for (const alert of activeAlerts) {
            const currentPrice = priceResponse.data[alert.coinId]?.usd;
            if (typeof currentPrice !== "number") {
                continue;
            }

            const shouldTrigger = alert.direction === "ABOVE"
                ? currentPrice >= alert.targetPrice
                : currentPrice <= alert.targetPrice;

            if (shouldTrigger) {
                // 1. Mark as triggered and deactivate
                alert.isTriggered = true;
                alert.isActive = false;
                alert.lastTriggeredAt = new Date();
                await alert.save();

                console.log(`[Alerts Worker] Alert triggered for ${alert.coinName} at $${currentPrice}. Target was $${alert.targetPrice} (${alert.direction}).`);

                // 2. Queue Email Job (Background Task)
                const user = alert.user as any; // populated User object
                if (user && user.email) {
                    const userName = user.name || "CypherSight User";
                    
                    // Push to Redis BullMQ
                    await alertQueue.add("send-alert-email", {
                        email: user.email,
                        userName,
                        coinName: alert.coinName,
                        coinSymbol: alert.coinSymbol,
                        currentPrice,
                        targetPrice: alert.targetPrice,
                        direction: alert.direction,
                    });
                }
            }
        }
    } catch (error) {
        console.error("[Alerts Worker] Error evaluating active alerts:", error);
    }
};
