import mongoose, { Schema, Model } from "mongoose";
import { IRefreshToken } from "../types/auth.types";


// 1. Model Type
type RefreshTokenModel = Model<IRefreshToken>;

// 2. Define the Schema
const refreshTokenSchema = new Schema<IRefreshToken, RefreshTokenModel>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    tokenHash: {
        type: String,
        required: true,
        unique: true, // We can enforce uniqueness since it's a deterministic hash
    },
    familyId: {
        type: String,
        required: true,
        index: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        // TTL index to automatically delete expired tokens
        index: { expires: 0 } 
    },
    isRevoked: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// 3. Export Model
const RefreshToken = mongoose.model<IRefreshToken, RefreshTokenModel>("RefreshToken", refreshTokenSchema);

export default RefreshToken;
