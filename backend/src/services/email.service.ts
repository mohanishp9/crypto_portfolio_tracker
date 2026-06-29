import axios from "axios";

interface SendEmailParams {
    to: string;
    recipientName: string;
    subject: string;
    htmlContent: string;
}

export const sendTransactionalEmail = async ({
    to,
    recipientName,
    subject,
    htmlContent,
}: SendEmailParams): Promise<boolean> => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || "Grove Portfolio Tracker";

    if (!apiKey || apiKey.trim() === "") {
        console.warn("[Email Service] BREVO_API_KEY is not configured in .env. Skipping email send.");
        return false;
    }

    if (!senderEmail || senderEmail.trim() === "") {
        console.warn("[Email Service] BREVO_SENDER_EMAIL is not configured in .env. Skipping email send.");
        return false;
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
            return true;
        }

        console.error("[Email Service] Brevo returned unexpected status:", response.status, response.data);
        return false;
    } catch (error: any) {
        console.error("[Email Service] Failed to send email via Brevo:", error.response?.data || error.message);
        return false;
    }
};
