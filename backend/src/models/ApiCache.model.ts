import mongoose, { Schema } from "mongoose";
import { IApiCache } from "../types/cache.types";

const apiCacheSchema = new Schema<IApiCache>(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        data: {
            type: Schema.Types.Mixed,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        staleUntil: {
            type: Date,
            default: null,
        },
        lastUpdatedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    { timestamps: true }
);

apiCacheSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 14 });

const ApiCache = mongoose.model<IApiCache>("ApiCache", apiCacheSchema);

export default ApiCache;
