import axios from "axios";
import { redis } from "../config/redis";

interface SendEmailParams {
    to: string;
    recipientName: string;
    subject: string;
    htmlContent: string;
    type?: 'otp' | 'alert';
}

export const sendTransactionalEmail = async ({
    to,
    recipientName,
    subject,
    htmlContent,
    type = 'otp'
}: SendEmailParams): Promise<boolean> => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || "CypherSight";

    if (!apiKey || apiKey.trim() === "") {
        console.warn("[Email Service] BREVO_API_KEY is not configured in .env. Skipping email send.");
        return false;
    }

    if (!senderEmail || senderEmail.trim() === "") {
        console.warn("[Email Service] BREVO_SENDER_EMAIL is not configured in .env. Skipping email send.");
        return false;
    }

    let redisKey = "";
    if (redis) {
        const dateKey = new Date().toISOString().split('T')[0];
        redisKey = `brevo:emails_sent:${dateKey}`;
        const count = await redis.get(redisKey);
        const currentCount = parseInt(count || "0", 10);
        
        const BREVO_DAILY_QUOTA = 300;
        const OTP_RESERVE = 50; // Reserve at least 50 emails for OTPs
        
        if (currentCount === BREVO_DAILY_QUOTA - 50) {
            console.warn(`[Email Service] ALERT: Approaching Brevo daily quota! (${currentCount}/${BREVO_DAILY_QUOTA}). Alert emails will be paused.`);
        }

        if (type === 'alert' && currentCount >= (BREVO_DAILY_QUOTA - OTP_RESERVE)) {
            console.warn(`[Email Service] Alert email dropped to preserve quota for OTPs. Current count: ${currentCount}`);
            // Return true to avoid failing the BullMQ job continuously, or false if we want it to retry later?
            // Returning false will make it retry. If we want it to fail without retry, we could throw, or return true but not send.
            // But if it's returning false, BullMQ will retry and might send it the next day.
            return false;
        }
    }

    try {
        const response = await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            {
                sender: { name: senderName, email: senderEmail },
                to: [{ email: to, name: recipientName }],
                subject: subject,
                htmlContent: htmlContent,
            },
            {
                headers: {
                    "api-key": apiKey,
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.status === 201 || response.status === 200) {
            console.log(`[Email Service] Email sent successfully to ${to}. Message ID: ${response.data?.messageId}`);
            if (redis && redisKey) {
                await redis.incr(redisKey);
                await redis.expire(redisKey, 86400 * 2); // 2 days
            }
            return true;
        }

        console.error("[Email Service] Brevo returned unexpected status:", response.status, response.data);
        return false;
    } catch (error: any) {
        console.error("[Email Service] Failed to send email via Brevo:", error.response?.data || error.message);
        return false;
    }
};
