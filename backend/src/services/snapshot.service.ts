import PortfolioSnapshot from "../models/PortfolioSnapshot.model";
import { PortfolioSnapshotPoint } from "../types/portfolio.types";

const SNAPSHOT_INTERVAL_MS = 1000 * 60 * 60 * 6;

export const maybeCreateSnapshot = async (
    userId: string,
    investment: number,
    currentValue: number,
    profitLoss: number
) => {
    const latest = await PortfolioSnapshot.findOne({ user: userId }).sort({ capturedAt: -1 }).lean();

    if (latest && Date.now() - new Date(latest.capturedAt).getTime() < SNAPSHOT_INTERVAL_MS) {
        return;
    }

    await PortfolioSnapshot.create({
        user: userId,
        investment,
        currentValue,
        profitLoss,
        capturedAt: new Date(),
    });
};

export const getPortfolioHistory = async (userId: string): Promise<PortfolioSnapshotPoint[]> => {
    const snapshots = await PortfolioSnapshot.find({ user: userId })
        .sort({ capturedAt: 1 })
        .limit(60)
        .lean();

    return snapshots.map((snapshot) => ({
        _id: String(snapshot._id),
        investment: snapshot.investment,
        currentValue: snapshot.currentValue,
        profitLoss: snapshot.profitLoss,
        capturedAt: snapshot.capturedAt,
    }));
};
