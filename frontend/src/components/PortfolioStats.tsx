import type { PortfolioStatsResponse } from "../types/portfolio.types";
import { CardSkeleton, InsightCardSkeleton } from "./common/Skeleton";

interface PortfolioStatsProps {
    statsData?: PortfolioStatsResponse;
    isLoading?: boolean;
}

const accentFor = (value: number) => (value < 0 ? "text-rose-500" : "text-emerald-500");

const MetricCard = ({
    label,
    value,
    caption,
    accentClass,
}: {
    label: string;
    value: string;
    caption: string;
    accentClass?: string;
}) => (
    <div className="bg-zinc-900/80 p-6 flex flex-col justify-center group hover:bg-zinc-800/60 transition-colors duration-300">
        <h3 className="text-[10px] tracking-widest uppercase text-zinc-500 mb-3 flex items-center gap-2">
            <span className="block w-2 h-2 rounded-full bg-indigo-500/50" />
            {label}
        </h3>
        <p className={`font-mono text-3xl font-semibold tracking-tight ${accentClass ?? "text-zinc-50"}`}>
            {value}
        </p>
        <span className="mt-3 block text-[10px] tracking-widest text-zinc-600 uppercase group-hover:text-zinc-400 transition-colors">
            {caption}
        </span>
    </div>
);

const InsightCard = ({
    title,
    holding,
    value,
}: {
    title: string;
    holding?: { coinName: string; coinSymbol: string } | null;
    value: string;
}) => (
    <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm">
        <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-4">{title}</p>
        <div className="font-semibold text-xl text-zinc-50">
            {holding?.coinName ?? "Waiting for data"}
        </div>
        <div className="text-xs tracking-wider uppercase text-zinc-500 font-mono mt-1">
            {holding?.coinSymbol ?? "N/A"}
        </div>
        <div className="text-sm text-zinc-300 mt-4 font-mono font-medium">{value}</div>
    </div>
);

const PortfolioStats = ({ statsData, isLoading }: PortfolioStatsProps) => {
    if (isLoading) {
        return (
            <div className="space-y-4 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <InsightCardSkeleton />
                    <InsightCardSkeleton />
                    <InsightCardSkeleton />
                </div>
            </div>
        );
    }

    const insights = statsData?.insights;
    const profitLoss = statsData?.profitLoss ?? 0;

    return (
        <div className="space-y-4 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800 rounded-xl overflow-hidden shadow-sm border border-zinc-800">
                <MetricCard
                    label="Total Value"
                    value={`$${statsData?.currentValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}`}
                    caption="Portfolio worth"
                />
                <MetricCard
                    label="Total Investment"
                    value={`$${statsData?.investment?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}`}
                    caption="Active capital cost"
                />
                <MetricCard
                    label="Net Profit / Loss"
                    value={`${profitLoss >= 0 ? "+" : ""}$${Math.abs(profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    caption="Total performance"
                    accentClass={accentFor(profitLoss)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800 rounded-xl overflow-hidden shadow-sm border border-zinc-800">
                <MetricCard
                    label="Unrealized PnL"
                    value={`${(statsData?.unrealizedProfit ?? 0) >= 0 ? "+" : ""}$${Math.abs(statsData?.unrealizedProfit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    caption="Paper gains / losses"
                    accentClass={accentFor(statsData?.unrealizedProfit ?? 0)}
                />
                <MetricCard
                    label="Realized PnL"
                    value={`${(statsData?.realizedProfit ?? 0) >= 0 ? "+" : ""}$${Math.abs(statsData?.realizedProfit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    caption="Locked-in gains / losses"
                    accentClass={accentFor(statsData?.realizedProfit ?? 0)}
                />
                <MetricCard
                    label="Total ROI"
                    value={`${(statsData?.profitPercentage ?? 0) >= 0 ? "+" : ""}${(statsData?.profitPercentage ?? 0).toFixed(2)}%`}
                    caption="Since inception"
                    accentClass={accentFor(statsData?.profitPercentage ?? 0)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <InsightCard
                    title="Largest Holding"
                    holding={insights?.largestHolding}
                    value={insights?.largestHolding ? `${insights.largestHolding.allocationPercent.toFixed(1)}% of portfolio` : "Your biggest position will show here."}
                />
                <InsightCard
                    title="Best Performer"
                    holding={insights?.bestPerformer}
                    value={insights?.bestPerformer ? `${insights.bestPerformer.totalReturn >= 0 ? "+" : ""}${insights.bestPerformer.totalReturn.toFixed(2)}% total return` : "Your strongest winner will show here."}
                />
                <InsightCard
                    title="Watch Concentration"
                    holding={insights?.worstPerformer}
                    value={`Top holding dominance ${insights?.topHoldingDominance?.toFixed(1) ?? "0.0"}%`}
                />
            </div>
        </div>
    );
};

export default PortfolioStats;
