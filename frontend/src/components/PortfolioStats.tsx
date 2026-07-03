import { useState } from "react";
import type { PortfolioStatsResponse } from "../types/portfolio.types";
import { CardSkeleton, InsightCardSkeleton } from "./common/Skeleton";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableDashboardWidget } from "./SortableDashboardWidget";

interface PortfolioStatsProps {
    statsData?: PortfolioStatsResponse;
    isLoading?: boolean;
}

const accentFor = (value: number) => (value < 0 ? "text-red-600" : "text-blue-700");

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
    <div className="brutalist-card h-full flex flex-col justify-center transition-colors duration-300">
        <h3 className="text-sm font-black uppercase tracking-tighter mb-3 border-b-4 border-black pb-2">
            {label}
        </h3>
        <p className={`font-mono text-3xl font-black tracking-tight ${accentClass ?? "text-black"}`}>
            {value}
        </p>
        <span className="mt-3 block text-xs font-mono font-bold uppercase text-black">
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
    <div className="brutalist-card h-full">
        <p className="text-sm font-black uppercase tracking-tighter mb-4 border-b-4 border-black pb-2">{title}</p>
        <div className="font-black text-xl text-black">
            {holding?.coinName ?? "WAITING FOR DATA"}
        </div>
        <div className="text-sm font-mono font-bold uppercase mt-1 bg-[#ccff00] inline-block border-2 border-black px-1">
            {holding?.coinSymbol ?? "N/A"}
        </div>
        <div className="text-sm text-black mt-4 font-mono font-black">{value}</div>
    </div>
);

const DEFAULT_STATS_ORDER = [
    "totalValue",
    "totalInvestment",
    "netProfitLoss",
    "unrealizedPnL",
    "realizedPnL",
    "totalROI",
    "largestHolding",
    "bestPerformer",
    "watchConcentration"
];

const PortfolioStats = ({ statsData, isLoading }: PortfolioStatsProps) => {
    const [statsOrder, setStatsOrder] = useState<string[]>(() => {
        const saved = localStorage.getItem("stats_layout");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length === DEFAULT_STATS_ORDER.length) {
                    return parsed;
                }
            } catch (e) {
                console.error("Failed to parse stats layout", e);
            }
        }
        return DEFAULT_STATS_ORDER;
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setStatsOrder((items) => {
                const oldIndex = items.indexOf(String(active.id));
                const newIndex = items.indexOf(String(over.id));
                const newOrder = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem("stats_layout", JSON.stringify(newOrder));
                return newOrder;
            });
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <InsightCardSkeleton />
                <InsightCardSkeleton />
                <InsightCardSkeleton />
            </div>
        );
    }

    const insights = statsData?.insights;
    const profitLoss = statsData?.profitLoss ?? 0;

    const renderWidget = (id: string) => {
        switch (id) {
            case "totalValue":
                return (
                    <SortableDashboardWidget key="totalValue" id="totalValue">
                        <MetricCard
                            label="Total Value"
                            value={`$${statsData?.currentValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}`}
                            caption="Portfolio worth"
                        />
                    </SortableDashboardWidget>
                );
            case "totalInvestment":
                return (
                    <SortableDashboardWidget key="totalInvestment" id="totalInvestment">
                        <MetricCard
                            label="Total Investment"
                            value={`$${statsData?.investment?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}`}
                            caption="Active capital cost"
                        />
                    </SortableDashboardWidget>
                );
            case "netProfitLoss":
                return (
                    <SortableDashboardWidget key="netProfitLoss" id="netProfitLoss">
                        <MetricCard
                            label="Net Profit / Loss"
                            value={`${profitLoss >= 0 ? "+" : ""}$${Math.abs(profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            caption="Total performance"
                            accentClass={accentFor(profitLoss)}
                        />
                    </SortableDashboardWidget>
                );
            case "unrealizedPnL":
                return (
                    <SortableDashboardWidget key="unrealizedPnL" id="unrealizedPnL">
                        <MetricCard
                            label="Unrealized PnL"
                            value={`${(statsData?.unrealizedProfit ?? 0) >= 0 ? "+" : ""}$${Math.abs(statsData?.unrealizedProfit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            caption="Paper gains / losses"
                            accentClass={accentFor(statsData?.unrealizedProfit ?? 0)}
                        />
                    </SortableDashboardWidget>
                );
            case "realizedPnL":
                return (
                    <SortableDashboardWidget key="realizedPnL" id="realizedPnL">
                        <MetricCard
                            label="Realized PnL"
                            value={`${(statsData?.realizedProfit ?? 0) >= 0 ? "+" : ""}$${Math.abs(statsData?.realizedProfit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            caption="Locked-in gains / losses"
                            accentClass={accentFor(statsData?.realizedProfit ?? 0)}
                        />
                    </SortableDashboardWidget>
                );
            case "totalROI":
                return (
                    <SortableDashboardWidget key="totalROI" id="totalROI">
                        <MetricCard
                            label="Total ROI"
                            value={`${(statsData?.profitPercentage ?? 0) >= 0 ? "+" : ""}${(statsData?.profitPercentage ?? 0).toFixed(2)}%`}
                            caption="Since inception"
                            accentClass={accentFor(statsData?.profitPercentage ?? 0)}
                        />
                    </SortableDashboardWidget>
                );
            case "largestHolding":
                return (
                    <SortableDashboardWidget key="largestHolding" id="largestHolding">
                        <InsightCard
                            title="Largest Holding"
                            holding={insights?.largestHolding}
                            value={insights?.largestHolding ? `${insights.largestHolding.allocationPercent.toFixed(1)}% of portfolio` : "Your biggest position will show here."}
                        />
                    </SortableDashboardWidget>
                );
            case "bestPerformer":
                return (
                    <SortableDashboardWidget key="bestPerformer" id="bestPerformer">
                        <InsightCard
                            title="Best Performer"
                            holding={insights?.bestPerformer}
                            value={insights?.bestPerformer ? `${insights.bestPerformer.totalReturn >= 0 ? "+" : ""}${insights.bestPerformer.totalReturn.toFixed(2)}% total return` : "Your strongest winner will show here."}
                        />
                    </SortableDashboardWidget>
                );
            case "watchConcentration":
                return (
                    <SortableDashboardWidget key="watchConcentration" id="watchConcentration">
                        <InsightCard
                            title="Watch Concentration"
                            holding={insights?.worstPerformer}
                            value={`Top holding dominance ${insights?.topHoldingDominance?.toFixed(1) ?? "0.0"}%`}
                        />
                    </SortableDashboardWidget>
                );
            default:
                return null;
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={statsOrder} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    {statsOrder.map((id) => renderWidget(id))}
                </div>
            </SortableContext>
        </DndContext>
    );
};

export default PortfolioStats;
