import { z } from "zod";

export const addHoldingSchema = z.object({
    coinId: z.string().min(1, "coinId is required"),
    coinName: z.string().min(1, "coinName is required"),
    coinSymbol: z.string().min(1, "coinSymbol is required"),
    quantity: z.number().positive("Quantity must be greater than 0"),
    buyPrice: z.number().positive("Buy price must be greater than 0"),
}).strict();

export const updateHoldingSchema = z.object({
    quantity: z.number().positive("Quantity must be greater than 0").optional(),
    buyPrice: z.number().positive("Buy price must be greater than 0").optional(),
}).strict();

/* Types */
export type AddHoldingInput = z.infer<typeof addHoldingSchema>;
export type UpdateHoldingInput = z.infer<typeof updateHoldingSchema>;