import mongoose, { Schema } from "mongoose";
import { ITransaction } from "../types/portfolio.types";


const transcationSchema = new Schema<ITransaction>(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        coinId: {
            type: String,
            required: true,
        },
        coinSymbol: {
            type: String,
            required: true,
        },
        coinName: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["BUY", "SELL"],
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        fee: {
            type: Number,
            default: 0,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
)

const Transaction = mongoose.model<ITransaction>("Transaction", transcationSchema);

export default Transaction;