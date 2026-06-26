import mongoose, { Schema, Types } from "mongoose";

interface IPortfolioSnapshot {
    user: Types.ObjectId;
    investment: number;
    currentValue: number;
    profitLoss: number;
    capturedAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const portfolioSnapshotSchema = new Schema<IPortfolioSnapshot>(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        investment: {
            type: Number,
            required: true,
        },
        currentValue: {
            type: Number,
            required: true,
        },
        profitLoss: {
            type: Number,
            required: true,
        },
        capturedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    { timestamps: true }
);

portfolioSnapshotSchema.index({ user: 1, capturedAt: -1 });

const PortfolioSnapshot = mongoose.model<IPortfolioSnapshot>("PortfolioSnapshot", portfolioSnapshotSchema);

export default PortfolioSnapshot;
