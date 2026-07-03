import { useState } from "react";
import { useGetPortfolioAnalyticsQuery } from "../services/portfolioApi";
import { TableRowSkeleton } from "./common/Skeleton";
import { ChevronDown, ChevronUp } from "lucide-react";
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
import { SortableMetricCard } from "./SortableMetricCard";

const DEFAULT_ORDER = ["sharpe", "drawdown", "volatility", "extremes"];

const PortfolioAnalytics = () => {
    const { data, isLoading } = useGetPortfolioAnalyticsQuery();
    const [isOpen, setIsOpen] = useState(false);
    const [cardOrder, setCardOrder] = useState<string[]>(() => {
        const savedOrder = localStorage.getItem("portfolio_metrics_layout");
        if (savedOrder) {
            try {
                const parsed = JSON.parse(savedOrder);
                if (Array.isArray(parsed) && parsed.length === DEFAULT_ORDER.length) {
                    return parsed;
                }
            } catch (e) {
                console.error("Failed to parse saved layout", e);
            }
        }
        return DEFAULT_ORDER;
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setCardOrder((items) => {
                const oldIndex = items.indexOf(String(active.id));
                const newIndex = items.indexOf(String(over.id));

                const newOrder = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem("portfolio_metrics_layout", JSON.stringify(newOrder));
                return newOrder;
            });
        }
    };

    if (isLoading) {
        return (
            <div className="mt-8 bg-white border-4 border-black brutalist-shadow-sm overflow-hidden">
                <div className="p-6 bg-black border-b-4 border-black">
                    <p className="text-sm tracking-widest font-black uppercase text-[#ccff00] mb-2">
                        AGGREGATED DATA
                    </p>
                    <h3 className="font-black text-xl text-white tracking-tight flex items-center gap-2 uppercase">
                        MONGODB PIPELINE ANALYTICS
                    </h3>
                </div>
                <div className="p-6 overflow-x-auto bg-[#f4f4f0]">
                    <table className="min-w-full bg-white border-4 border-black">
                        <thead>
                            <tr className="border-b-4 border-black bg-[#ccff00]">
                                {["Asset", "Tx Count", "Total Bought", "Total Sold", "Net Position", "Avg Buy Price", "Avg Sell Price", "Traded Period"].map((h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-3 text-right text-sm font-black text-black uppercase tracking-wider first:text-left border-r-2 border-black last:border-r-0"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-black">
                            <TableRowSkeleton columnsCount={8} />
                            <TableRowSkeleton columnsCount={8} />
                            <TableRowSkeleton columnsCount={8} />
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    const items = data?.analytics || [];
    const metrics = data?.performanceMetrics;

    if (items.length === 0) {
        return null;
    }

    const renderCard = (id: string) => {
        if (!metrics) return null;
        switch (id) {
            case "sharpe":
                return (
                    <SortableMetricCard
                        key="sharpe"
                        id="sharpe"
                        title="Sharpe Ratio"
                        value={
                            <p className={`text-4xl font-black tracking-tighter ${metrics.sharpeRatio >= 1 ? 'text-black' : metrics.sharpeRatio > 0 ? 'text-black' : 'text-[#ff3333]'}`}>
                                {metrics.sharpeRatio.toFixed(2)}
                            </p>
                        }
                        description="Risk-adjusted return"
                    />
                );
            case "drawdown":
                return (
                    <SortableMetricCard
                        key="drawdown"
                        id="drawdown"
                        title="Max Drawdown"
                        value={
                            <p className="text-4xl font-black tracking-tighter text-[#ff3333]">
                                -{metrics.maxDrawdown.toFixed(2)}%
                            </p>
                        }
                        description="Peak-to-trough drop"
                    />
                );
            case "volatility":
                return (
                    <SortableMetricCard
                        key="volatility"
                        id="volatility"
                        title="Volatility"
                        value={
                            <p className="text-4xl font-black tracking-tighter text-blue-700">
                                {metrics.volatility.toFixed(2)}%
                            </p>
                        }
                        description="Annualized std dev"
                    />
                );
            case "extremes":
                return (
                    <SortableMetricCard
                        key="extremes"
                        id="extremes"
                        title="Best / Worst Day"
                        value={
                            <div className="flex items-center gap-2">
                                <p className="text-3xl font-black tracking-tighter text-black">+{metrics.bestDay.toFixed(2)}%</p>
                                <span className="text-black font-black text-3xl">/</span>
                                <p className="text-3xl font-black tracking-tighter text-[#ff3333]">{metrics.worstDay.toFixed(2)}%</p>
                            </div>
                        }
                        description="Single period extremes"
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="mt-8 space-y-6">
            {metrics && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={cardOrder}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {cardOrder.map(id => renderCard(id))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            <div className="brutalist-card p-0 overflow-hidden bg-white">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between p-6 bg-black hover:bg-zinc-900 transition-colors text-left focus:outline-none border-b-4 border-black"
                >
                    <div>
                        <p className="text-sm font-black tracking-widest uppercase text-[#ccff00] mb-2">
                            AGGREGATED DATA
                        </p>
                        <h3 className="font-black text-xl text-white tracking-tight flex items-center gap-2 uppercase">
                            MONGODB PIPELINE ANALYTICS
                        </h3>
                    </div>
                    <div className="text-white flex items-center gap-2 text-sm font-black uppercase">
                        {isOpen ? "COLLAPSE" : "EXPAND"}
                        {isOpen ? <ChevronUp size={24} strokeWidth={3} /> : <ChevronDown size={24} strokeWidth={3} />}
                    </div>
                </button>

                {isOpen && (
                    <div className="overflow-x-auto bg-[#f4f4f0] p-6">
                        <table className="min-w-full bg-white border-4 border-black">
                            <thead>
                                <tr className="border-b-4 border-black bg-[#ccff00]">
                                    {["Asset", "Tx Count", "Total Bought", "Total Sold", "Net Position", "Avg Buy Price", "Avg Sell Price", "Traded Period"].map((h) => (
                                        <th
                                            key={h}
                                            className="px-5 py-3 text-right text-sm font-black text-black uppercase tracking-wider border-r-2 border-black last:border-r-0 first:text-left"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-black">
                                {items.map((item) => {
                                    const firstDate = new Date(item.firstTransaction).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
                                    const lastDate = new Date(item.lastTransaction).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
                                    return (
                                        <tr
                                            key={item.coinId}
                                            className="hover:bg-[#ccff00] transition-colors duration-150 group"
                                        >
                                            <td className="px-5 py-4 whitespace-nowrap text-left border-r-2 border-black">
                                                <div className="font-black text-sm text-black uppercase">
                                                    {item.coinName}
                                                </div>
                                                <div className="text-xs font-mono font-bold text-black uppercase mt-0.5 bg-black text-white inline-block px-1">
                                                    {item.coinSymbol}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-bold text-sm text-black border-r-2 border-black">
                                                {item.transactionCount}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right border-r-2 border-black">
                                                <div className="font-mono font-bold text-sm text-black">{item.totalBought.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                                                <div className="text-[10px] font-mono font-bold text-black mt-1">${item.totalBuyValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right border-r-2 border-black">
                                                <div className="font-mono font-bold text-sm text-black">{item.totalSold.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                                                <div className="text-[10px] font-mono font-bold text-black mt-1">${item.totalSellValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right font-mono text-sm font-black border-r-2 border-black">
                                                <span className={item.netQuantity > 0 ? "text-blue-700" : item.netQuantity === 0 ? "text-black" : "text-[#ff3333]"}>
                                                    {item.netQuantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-bold text-sm text-black border-r-2 border-black">
                                                ${item.avgBuyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-bold text-sm text-black border-r-2 border-black">
                                                {item.totalSold > 0 ? `$${item.avgSellPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A"}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right text-xs text-black font-mono font-bold">
                                                {firstDate} - {lastDate}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortfolioAnalytics;
