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
import type { PortfolioStatsResponse } from "../types/portfolio.types";

const colors = ["#587560", "#c4885a", "#9aab97", "#8b5e3c", "#d4cfc4"];

const currency = (value: number) =>
    `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const PortfolioCharts = ({ statsData }: { statsData?: PortfolioStatsResponse }) => {
    const allocationData = (statsData?.portfolio ?? []).slice(0, 5).map((item) => ({
        name: item.coinSymbol.toUpperCase(),
        value: Number(item.allocationPercent.toFixed(2)),
    }));

    const chartData = (statsData?.chart ?? []).map((point) => ({
        ...point,
        label: new Date(point.capturedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    }));

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
            <div className="p-6" style={{ background: "#2e3330", border: "1px solid rgba(61,74,62,0.3)" }}>
                <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b7c6a" }}>
                    Allocation
                </p>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", color: "#ede8dd", marginTop: "12px" }}>
                    Portfolio Mix
                </h3>
                <div style={{ height: 280, marginTop: "20px" }}>
                    {allocationData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={allocationData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={2}>
                                    {allocationData.map((entry, index) => (
                                        <Cell key={entry.name} fill={colors[index % colors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ color: "#6b7c6a", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            Allocation appears after your first holding.
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6" style={{ background: "#2e3330", border: "1px solid rgba(61,74,62,0.3)" }}>
                <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b7c6a" }}>
                    Performance
                </p>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", color: "#ede8dd", marginTop: "12px" }}>
                    Value Over Time
                </h3>
                <div style={{ height: 280, marginTop: "20px" }}>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="portfolioValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#587560" stopOpacity={0.7} />
                                        <stop offset="95%" stopColor="#587560" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="rgba(107,124,106,0.15)" vertical={false} />
                                <XAxis dataKey="label" stroke="#6b7c6a" tick={{ fontSize: 10 }} />
                                <YAxis stroke="#6b7c6a" tick={{ fontSize: 10 }} tickFormatter={currency} />
                                <Tooltip formatter={(value: number) => currency(value)} />
                                <Area type="monotone" dataKey="currentValue" stroke="#587560" fillOpacity={1} fill="url(#portfolioValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ color: "#6b7c6a", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            Snapshot history will accumulate as you keep using the dashboard.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PortfolioCharts;
