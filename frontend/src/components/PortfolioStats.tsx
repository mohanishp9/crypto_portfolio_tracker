import type { PortfolioStatsResponse } from "../types/portfolio.types";

interface PortfolioStatsProps {
    statsData?: PortfolioStatsResponse;
}

const accentFor = (value: number) => (value < 0 ? "#8b5e3c" : "#587560");

const MetricCard = ({
    label,
    value,
    caption,
    accent,
}: {
    label: string;
    value: string;
    caption: string;
    accent?: string;
}) => (
    <div className="bg-[#2e3330] p-6 group hover:bg-[#2a3d2e] transition-colors duration-500">
        <h3 className="text-[10px] tracking-[0.3em] uppercase text-[#6b7c6a] mb-4 flex items-center gap-2">
            <span className="block w-4 h-px bg-[#6b7c6a]/50" />
            {label}
        </h3>
        <p className="font-light text-2xl tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif", color: accent ?? "#ede8dd" }}>
            {value}
        </p>
        <span className="mt-3 block text-[10px] tracking-[0.2em] text-[#3d4a3e] group-hover:text-[#587560] uppercase">
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
    <div className="p-5" style={{ background: "#2e3330", border: "1px solid rgba(61,74,62,0.25)" }}>
        <p style={{ fontSize: "0.52rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b7c6a" }}>{title}</p>
        <div className="mt-3" style={{ color: "#ede8dd", fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem" }}>
            {holding?.coinName ?? "Waiting for data"}
        </div>
        <div style={{ fontSize: "0.52rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#9aab97", marginTop: "4px" }}>
            {holding?.coinSymbol ?? "N/A"}
        </div>
        <div style={{ fontSize: "0.72rem", color: "#d4cfc4", marginTop: "12px" }}>{value}</div>
    </div>
);

const PortfolioStats = ({ statsData }: PortfolioStatsProps) => {
    const insights = statsData?.insights;

    return (
        <div className="space-y-5 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#3d4a3e]/20 rounded-sm overflow-hidden">
                <MetricCard
                    label="Total Value"
                    value={`$${statsData?.currentValue?.toFixed(2) ?? "0.00"}`}
                    caption="Portfolio worth"
                />
                <MetricCard
                    label="Total Investment"
                    value={`$${statsData?.investment?.toFixed(2) ?? "0.00"}`}
                    caption="Capital deployed"
                />
                <MetricCard
                    label="Profit / Loss"
                    value={`${(statsData?.profitLoss ?? 0) >= 0 ? "+" : ""}$${statsData?.profitLoss?.toFixed(2) ?? "0.00"}`}
                    caption={(statsData?.profitLoss ?? 0) >= 0 ? "Returning gain" : "Unrealized loss"}
                    accent={accentFor(statsData?.profitLoss ?? 0)}
                />
                <MetricCard
                    label="Change"
                    value={`${(statsData?.profitPercentage ?? 0) >= 0 ? "+" : ""}${statsData?.profitPercentage?.toFixed(2) ?? "0.00"}%`}
                    caption="Since inception"
                    accent={accentFor(statsData?.profitPercentage ?? 0)}
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
                    value={insights?.bestPerformer ? `${insights.bestPerformer.totalReturn.toFixed(2)}% total return` : "Your strongest winner will show here."}
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
