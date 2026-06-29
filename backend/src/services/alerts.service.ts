import PriceAlert from "../models/PriceAlert.model";
import { CoinPriceResponse } from "../types/coinsData.types";
import { getCurrentPrice } from "./coinGecko.service";
import { sendTransactionalEmail } from "./email.service";
import { IUser } from "../types/user.types";

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

                // 2. Email user
                const user = alert.user as any; // populated User object
                if (user && user.email) {
                    const userName = user.name || "Grove User";
                    const subject = `[Grove Alert] ${alert.coinName} has crossed $${alert.targetPrice}`;
                    const htmlContent = `
<div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f7f9f7; padding: 40px 20px; color: #2e3330;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid rgba(61,74,62,0.15); padding: 40px;">
    <h2 style="font-family: Georgia, serif; font-size: 24px; color: #2a3d2e; border-bottom: 2px solid #587560; padding-bottom: 15px; margin-top: 0;">
      Grove Price Alert
    </h2>
    <p style="font-size: 16px; line-height: 1.6; color: #2e3330; margin-top: 20px;">
      Hello ${userName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #2e3330;">
      Your price alert threshold has been crossed!
    </p>
    <div style="background-color: #2a3d2e; color: #ede8dd; padding: 24px; margin: 30px 0; border-radius: 4px; text-align: center;">
      <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #9aab97; margin-bottom: 8px;">
        ${alert.coinName} (${alert.coinSymbol.toUpperCase()})
      </div>
      <div style="font-size: 32px; font-weight: bold; margin-bottom: 10px;">
        $${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
      </div>
      <div style="font-size: 13px; color: #c4885a; letter-spacing: 0.05em;">
        Crossed your alert direction <strong>${alert.direction}</strong> threshold of $${alert.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </div>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #6b7c6a; margin-top: 30px; border-top: 1px solid rgba(61,74,62,0.1); padding-top: 20px;">
      This alert is now completed. If you want to continue tracking, please log in to your dashboard to set a new alert.
    </p>
    <p style="font-size: 12px; color: #9aab97; text-align: center; margin-top: 40px; font-style: italic;">
      Sent from Grove Crypto Tracker.
    </p>
  </div>
</div>
                    `;

                    await sendTransactionalEmail({
                        to: user.email,
                        recipientName: userName,
                        subject,
                        htmlContent,
                    });
                }
            }
        }
    } catch (error) {
        console.error("[Alerts Worker] Error evaluating active alerts:", error);
    }
};
