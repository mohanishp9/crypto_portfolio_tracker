import mongoose, { Schema } from "mongoose";
import { IWatchlistItem } from "../types/watchlist.types";

const watchlistItemSchema = new Schema<IWatchlistItem>(
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
    },
    { timestamps: true }
);

watchlistItemSchema.index({ user: 1, coinId: 1 }, { unique: true });

const WatchlistItem = mongoose.model<IWatchlistItem>("WatchlistItem", watchlistItemSchema);

export default WatchlistItem;
