import { useState } from "react";
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

// Brutalist Palette: Neon Green, Neon Red, Pure Blue, Magenta, Cyan
const colors = ["#ccff00", "#ff3333", "#0000ff", "#ff00ff", "#00ffff"];

const currency = (value: number) =>
    `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const PortfolioCharts = ({ statsData, isLoading }: { statsData?: PortfolioStatsResponse; isLoading?: boolean }) => {
    const [chartOrder, setChartOrder] = useState<string[]>(() => {
        const saved = localStorage.getItem("charts_layout");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length === 2) {
                    return parsed;
                }
            } catch (e) {
                console.error("Failed to parse chart layout", e);
            }
        }
        return ["allocation", "performance"];
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

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
                    <div className="brutalist-card h-full">
                        <p className="text-sm tracking-widest font-black uppercase text-black border-b-4 border-black pb-2">
                            Allocation
                        </p>
                        <h3 className="font-black text-xl text-black tracking-tight mt-4">
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
                                            stroke="#000000"
                                            strokeWidth={3}
                                        >
                                            {allocationData.map((entry, index) => (
                                                <Cell key={entry.name} fill={colors[index % colors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value: number) => `${value.toFixed(2)}%`}
                                            contentStyle={{ backgroundColor: '#fff', border: '4px solid #000', color: '#000', borderRadius: '0', boxShadow: '4px 4px 0 #000', fontWeight: 'bold', fontFamily: "'JetBrains Mono', monospace" }}
                                            itemStyle={{ color: '#000' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center font-mono font-bold text-sm text-black">
                                    NO ALLOCATION DATA YET.
                                </div>
                            )}
                        </div>
                    </div>
                </SortableDashboardWidget>
            );
        } else {
            return (
                <SortableDashboardWidget key="performance" id="performance">
                    <div className="brutalist-card h-full">
                        <p className="text-sm tracking-widest font-black uppercase text-black border-b-4 border-black pb-2">
                            Performance
                        </p>
                        <h3 className="font-black text-xl text-black tracking-tight mt-4">
                            Value Over Time
                        </h3>
                        <div className="h-72 mt-6">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="portfolioValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ccff00" stopOpacity={1} />
                                                <stop offset="95%" stopColor="#ccff00" stopOpacity={1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="#000" strokeDasharray="3 3" vertical={false} />
                                        <XAxis 
                                            dataKey="label" 
                                            stroke="#000" 
                                            tick={{ fontSize: 11, fill: '#000', fontWeight: 'bold', fontFamily: "'JetBrains Mono', monospace" }} 
                                            axisLine={{ stroke: '#000', strokeWidth: 4 }}
                                            tickLine={{ stroke: '#000', strokeWidth: 2 }}
                                            dy={10}
                                        />
                                        <YAxis 
                                            stroke="#000" 
                                            tick={{ fontSize: 11, fill: '#000', fontWeight: 'bold', fontFamily: "'JetBrains Mono', monospace" }} 
                                            tickFormatter={currency} 
                                            axisLine={{ stroke: '#000', strokeWidth: 4 }}
                                            tickLine={{ stroke: '#000', strokeWidth: 2 }}
                                            dx={-10}
                                        />
                                        <Tooltip 
                                            formatter={(value: number) => currency(value)}
                                            contentStyle={{ backgroundColor: '#fff', border: '4px solid #000', color: '#000', borderRadius: '0', boxShadow: '4px 4px 0 #000', fontWeight: 'bold', fontFamily: "'JetBrains Mono', monospace" }}
                                            itemStyle={{ color: '#000', fontWeight: 900 }}
                                        />
                                        <Area 
                                            type="step" 
                                            dataKey="currentValue" 
                                            stroke="#000" 
                                            strokeWidth={4}
                                            fillOpacity={1} 
                                            fill="url(#portfolioValue)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center font-mono font-bold text-sm text-black uppercase">
                                    WAITING FOR SNAPSHOTS...
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
