import mongoose, { Schema } from "mongoose";
import { IPriceAlert } from "../types/alert.types";

const priceAlertSchema = new Schema<IPriceAlert>(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        coinId: {
            type: String,
            required: true,
            trim: true,
        },
        coinSymbol: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        coinName: {
            type: String,
            required: true,
            trim: true,
        },
        direction: {
            type: String,
            enum: ["ABOVE", "BELOW"],
            required: true,
        },
        targetPrice: {
            type: Number,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isTriggered: {
            type: Boolean,
            default: false,
        },
        lastTriggeredAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

priceAlertSchema.index({ user: 1, coinId: 1 });

const PriceAlert = mongoose.model<IPriceAlert>("PriceAlert", priceAlertSchema);

export default PriceAlert;
