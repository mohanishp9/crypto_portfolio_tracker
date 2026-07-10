import { Worker, Job } from "bullmq";
import { connection } from "./queues";
import { sendTransactionalEmail } from "../services/email.service";

interface AlertJobData {
    email: string;
    userName: string;
    coinName: string;
    coinSymbol: string;
    currentPrice: number;
    targetPrice: number;
    direction: string;
}

export const emailWorker = new Worker<AlertJobData>(
    "alertQueue",
    async (job: Job<AlertJobData>) => {
        const { email, userName, coinName, coinSymbol, currentPrice, targetPrice, direction } = job.data;
        
        console.log(`[Email Worker] Processing alert email for ${email} regarding ${coinSymbol}`);

        const subject = `[CypherSight Alert] ${coinName} has crossed $${targetPrice}`;
        const htmlContent = `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; padding: 40px 20px; color: #171717;">
            <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 6px; padding: 32px;">
                <h1 style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 24px; color: #171717;">CypherSight</h1>
                <h2 style="font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Price Alert Triggered</h2>
                <p style="font-size: 14px; color: #52525b; line-height: 1.6; margin-bottom: 24px;">Hello ${userName}, your price alert threshold has been crossed!</p>
                
                <div style="background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 6px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #71717a; margin-bottom: 8px;">
                        ${coinName} (${coinSymbol.toUpperCase()})
                    </div>
                    <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 600; color: #171717; margin-bottom: 12px;">
                        $${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </div>
                    <div style="font-size: 13px; color: #52525b; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 4px; padding: 8px 12px; display: inline-block;">
                        Crossed your <strong>${direction}</strong> threshold of $${targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
                
                <p style="font-size: 12px; color: #71717a; line-height: 1.6; margin-bottom: 0;">This alert is now completed. If you want to continue tracking, please log in to your dashboard to set a new alert.</p>
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0 24px 0;" />
                <p style="font-size: 12px; color: #71717a; margin: 0; text-align: center;">Sent from CypherSight Crypto Tracker</p>
            </div>
        </div>
        `;

        await sendTransactionalEmail({
            to: email,
            recipientName: userName,
            subject,
            htmlContent,
            type: 'alert'
        });

        console.log(`[Email Worker] Successfully sent alert email for ${coinSymbol} to ${email}`);
    },
    { connection: connection as any }
);

emailWorker.on("failed", (job, err) => {
    console.error(`[Email Worker] Job ${job?.id} failed with error:`, err.message);
});
