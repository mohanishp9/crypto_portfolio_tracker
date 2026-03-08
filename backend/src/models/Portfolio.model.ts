import mongoose, { Schema, Model } from "mongoose";
import { IHolding, IPortfolio } from "../types/portfolio.types";


const holdingSchema = new Schema<IHolding>({
    coinId: {
        type: String,
        required: true,
    },
    coinName: {
        type: String,
        required: true,
    },
    coinSymbol: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    buyPrice: {
        type: Number,
        required: true,
    },
    purchaseDate: {
        type: Date,
        default: Date.now,
    },
});

const portfolioSchema = new Schema<IPortfolio>({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    holdings: [holdingSchema],
}, {
    timestamps: true,
});

const Portfolio = mongoose.model<IPortfolio>("Portfolio", portfolioSchema);

export default Portfolio;