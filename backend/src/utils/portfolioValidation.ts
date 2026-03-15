import { z } from "zod";

export const addTransactionSchema = z.object({
    coinId: z.string().min(1, "coinId is required"),
    coinSymbol: z.string().min(1, "coinSymbol is required"),
    coinName: z.string().min(1, "coinName is required"),
    type: z.enum(["BUY", "SELL"]),
    quantity: z.number().positive("Quantity must be greater than 0"),
    price: z.number().positive("Buy price must be greater than 0"),
    fee: z.number().optional(),
}).strict();

export const updateHoldingSchema = z.object({
    quantity: z.number().positive("Quantity must be greater than 0").optional(),
    buyPrice: z.number().positive("Buy price must be greater than 0").optional(),
}).strict();

/* Types */
export type addTransactionSchema = z.infer<typeof addTransactionSchema>;
export type UpdateHoldingInput = z.infer<typeof updateHoldingSchema>;