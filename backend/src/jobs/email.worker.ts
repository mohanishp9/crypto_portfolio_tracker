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
<div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f7f9f7; padding: 40px 20px; color: #2e3330;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid rgba(61,74,62,0.15); padding: 40px;">
    <h2 style="font-family: Georgia, serif; font-size: 24px; color: #2a3d2e; border-bottom: 2px solid #587560; padding-bottom: 15px; margin-top: 0;">
      CypherSight Price Alert
    </h2>
    <p style="font-size: 16px; line-height: 1.6; color: #2e3330; margin-top: 20px;">
      Hello ${userName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #2e3330;">
      Your price alert threshold has been crossed!
    </p>
    <div style="background-color: #2a3d2e; color: #ede8dd; padding: 24px; margin: 30px 0; border-radius: 4px; text-align: center;">
      <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #9aab97; margin-bottom: 8px;">
        ${coinName} (${coinSymbol.toUpperCase()})
      </div>
      <div style="font-size: 32px; font-weight: bold; margin-bottom: 10px;">
        $${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
      </div>
      <div style="font-size: 13px; color: #c4885a; letter-spacing: 0.05em;">
        Crossed your alert direction <strong>${direction}</strong> threshold of $${targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </div>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #6b7c6a; margin-top: 30px; border-top: 1px solid rgba(61,74,62,0.1); padding-top: 20px;">
      This alert is now completed. If you want to continue tracking, please log in to your dashboard to set a new alert.
    </p>
    <p style="font-size: 12px; color: #9aab97; text-align: center; margin-top: 40px; font-style: italic;">
      Sent from CypherSight Crypto Tracker.
    </p>
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
