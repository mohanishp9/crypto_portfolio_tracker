import { useState, useEffect } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Cell,
} from "recharts";
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
import type { PortfolioStatsResponse } from "../types/portfolio.types";
import { ChartSkeleton } from "./common/Skeleton";

// Modern Fintech Palette: Emerald, Cyan, Indigo, Violet, Rose
const colors = ["#10b981", "#06b6d4", "#4f46e5", "#8b5cf6", "#f43f5e"];

const currency = (value: number) =>
    `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const PortfolioCharts = ({ statsData, isLoading }: { statsData?: PortfolioStatsResponse; isLoading?: boolean }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
                <ChartSkeleton />
                <ChartSkeleton />
            </div>
        );
    }

    const allocationData = (statsData?.portfolio ?? []).slice(0, 5).map((item) => ({
        name: item.coinSymbol.toUpperCase(),
        value: Number(item.allocationPercent.toFixed(2)),
    }));

    const chartData = (statsData?.chart ?? []).map((point) => ({
        ...point,
        label: new Date(point.capturedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    }));

    const [chartOrder, setChartOrder] = useState<string[]>(["allocation", "performance"]);

    useEffect(() => {
        const saved = localStorage.getItem("charts_layout");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length === 2) {
                    setChartOrder(parsed);
                }
            } catch (e) {}
        }
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setChartOrder((items) => {
                const oldIndex = items.indexOf(String(active.id));
                const newIndex = items.indexOf(String(over.id));
                const newOrder = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem("charts_layout", JSON.stringify(newOrder));
                return newOrder;
            });
        }
    };

    const renderChart = (id: string) => {
        if (id === "allocation") {
            return (
                <SortableDashboardWidget key="allocation" id="allocation">
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm h-full">
                        <p className="text-[10px] tracking-widest uppercase text-zinc-500">
                            Allocation
                        </p>
                        <h3 className="font-semibold text-lg text-zinc-50 tracking-tight mt-2">
                            Portfolio Mix
                        </h3>
                        <div className="h-72 mt-6">
                            {allocationData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={allocationData} 
                                            dataKey="value" 
                                            nameKey="name" 
                                            innerRadius={70} 
                                            outerRadius={100} 
                                            paddingAngle={3}
                                            stroke="none"
                                        >
                                            {allocationData.map((entry, index) => (
                                                <Cell key={entry.name} fill={colors[index % colors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value: number) => `${value.toFixed(2)}%`}
                                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fafafa', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fafafa' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-zinc-500">
                                    Allocation appears after your first holding.
                                </div>
                            )}
                        </div>
                    </div>
                </SortableDashboardWidget>
            );
        } else {
            return (
                <SortableDashboardWidget key="performance" id="performance">
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm h-full">
                        <p className="text-[10px] tracking-widest uppercase text-zinc-500">
                            Performance
                        </p>
                        <h3 className="font-semibold text-lg text-zinc-50 tracking-tight mt-2">
                            Value Over Time
                        </h3>
                        <div className="h-72 mt-6 overflow-x-auto custom-scrollbar">
                            {chartData.length > 0 ? (
                                <div style={{ minWidth: '550px', height: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="portfolioValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.5} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                                        <XAxis 
                                            dataKey="label" 
                                            stroke="#a1a1aa" 
                                            tick={{ fontSize: 11, fill: '#71717a' }} 
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <YAxis 
                                            stroke="#a1a1aa" 
                                            tick={{ fontSize: 11, fill: '#71717a' }} 
                                            tickFormatter={currency} 
                                            axisLine={false}
                                            tickLine={false}
                                            dx={-10}
                                        />
                                        <Tooltip 
                                            formatter={(value: number) => currency(value)}
                                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fafafa', borderRadius: '8px' }}
                                            itemStyle={{ color: '#4f46e5', fontWeight: 600 }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="currentValue" 
                                            stroke="#4f46e5" 
                                            strokeWidth={2}
                                            fillOpacity={1} 
                                            fill="url(#portfolioValue)" 
                                        />
                                    </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-zinc-500">
                                    Snapshot history will accumulate as you keep using the dashboard.
                                </div>
                            )}
                        </div>
                    </div>
                </SortableDashboardWidget>
            );
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={chartOrder} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
                    {chartOrder.map((id) => renderChart(id))}
                </div>
            </SortableContext>
        </DndContext>
    );
};

export default PortfolioCharts;
