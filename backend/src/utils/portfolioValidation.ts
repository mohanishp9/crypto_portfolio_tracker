import { z } from "zod";

export const addTransactionSchema = z.object({
    coinId: z.string().min(1, "coinId is required"),
    coinSymbol: z.string().min(1, "coinSymbol is required"),
    coinName: z.string().min(1, "coinName is required"),
    type: z.enum(["BUY", "SELL"]),
    quantity: z.number().positive("Quantity must be greater than 0"),
    price: z.number().positive("Buy price must be greater than 0"),
    fee: z.number().optional(),
    timestamp: z.coerce.date().optional(),
}).strict();

export const updateTransactionSchema = addTransactionSchema.extend({
    timestamp: z.coerce.date().optional(),
}).strict();

export const watchlistItemSchema = z.object({
    coinId: z.string().min(1, "coinId is required"),
    coinSymbol: z.string().min(1, "coinSymbol is required"),
    coinName: z.string().min(1, "coinName is required"),
}).strict();

export const priceAlertSchema = z.object({
    coinId: z.string().min(1, "coinId is required"),
    coinSymbol: z.string().min(1, "coinSymbol is required"),
    coinName: z.string().min(1, "coinName is required"),
    direction: z.enum(["ABOVE", "BELOW"]),
    targetPrice: z.number().positive("Target price must be greater than 0"),
    isActive: z.boolean().optional(),
}).strict();

export const updatePriceAlertSchema = priceAlertSchema.partial().strict();

export const importTransactionsSchema = z.object({
    csv: z.string().min(1, "CSV is required"),
    previewOnly: z.boolean().optional(),
}).strict();

/* Types */
export type addTransactionSchema = z.infer<typeof addTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
