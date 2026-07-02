import { useState } from "react";
import { useGetPortfolioAnalyticsQuery } from "../services/portfolioApi";
import { TableRowSkeleton } from "./common/Skeleton";
import { ChevronDown, ChevronUp } from "lucide-react";

const PortfolioAnalytics = () => {
    const { data, isLoading } = useGetPortfolioAnalyticsQuery();
    const [isOpen, setIsOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 bg-zinc-900 border-b border-zinc-800">
                    <p className="text-[10px] tracking-widest uppercase text-zinc-500 mb-2">
                        Aggregated Data
                    </p>
                    <h3 className="font-semibold text-lg text-zinc-50 tracking-tight flex items-center gap-2">
                        MongoDB <span className="font-normal text-zinc-500 italic">Aggregation Pipeline Analytics</span>
                    </h3>
                </div>
                <div className="p-6 overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                {["Asset", "Tx Count", "Total Bought", "Total Sold", "Net Position", "Avg Buy Price", "Avg Sell Price", "Traded Period"].map((h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider first:text-left"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
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

    return (
        <div className="mt-8 space-y-6">
            {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm">
                        <p className="text-[10px] tracking-widest uppercase text-zinc-500 font-semibold mb-1">Sharpe Ratio</p>
                        <p className={`text-2xl font-semibold tracking-tight ${metrics.sharpeRatio >= 1 ? 'text-emerald-400' : metrics.sharpeRatio > 0 ? 'text-zinc-50' : 'text-rose-400'}`}>
                            {metrics.sharpeRatio.toFixed(2)}
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">Risk-adjusted return</p>
                    </div>
                    <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm">
                        <p className="text-[10px] tracking-widest uppercase text-zinc-500 font-semibold mb-1">Max Drawdown</p>
                        <p className="text-2xl font-semibold tracking-tight text-rose-400">
                            -{metrics.maxDrawdown.toFixed(2)}%
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">Peak-to-trough drop</p>
                    </div>
                    <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm">
                        <p className="text-[10px] tracking-widest uppercase text-zinc-500 font-semibold mb-1">Volatility</p>
                        <p className="text-2xl font-semibold tracking-tight text-indigo-400">
                            {metrics.volatility.toFixed(2)}%
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">Annualized std dev</p>
                    </div>
                    <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm">
                        <p className="text-[10px] tracking-widest uppercase text-zinc-500 font-semibold mb-1">Best / Worst Day</p>
                        <div className="flex items-center gap-2">
                            <p className="text-lg font-semibold tracking-tight text-emerald-400">+{metrics.bestDay.toFixed(2)}%</p>
                            <span className="text-zinc-700">/</span>
                            <p className="text-lg font-semibold tracking-tight text-rose-400">{metrics.worstDay.toFixed(2)}%</p>
                        </div>
                        <p className="text-xs text-zinc-600 mt-1">Single period extremes</p>
                    </div>
                </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between p-6 bg-zinc-900 hover:bg-zinc-800/80 transition-colors text-left focus:outline-none"
                >
                    <div>
                        <p className="text-[10px] tracking-widest uppercase text-indigo-500 mb-2 font-semibold">
                            Aggregated Data
                        </p>
                        <h3 className="font-semibold text-lg text-zinc-50 tracking-tight flex items-center gap-2">
                            MongoDB <span className="font-normal text-zinc-500 italic">Pipeline Analytics</span>
                        </h3>
                    </div>
                    <div className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2 text-sm font-medium">
                        {isOpen ? "Collapse" : "Expand"}
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                </button>

                {isOpen && (
                    <div className="overflow-x-auto border-t border-zinc-800 bg-zinc-950/50">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    {["Asset", "Tx Count", "Total Bought", "Total Sold", "Net Position", "Avg Buy Price", "Avg Sell Price", "Traded Period"].map((h) => (
                                        <th
                                            key={h}
                                            className="px-5 py-3 text-right text-[10px] font-semibold text-zinc-500 uppercase tracking-widest first:text-left"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {items.map((item) => {
                                    const firstDate = new Date(item.firstTransaction).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
                                    const lastDate = new Date(item.lastTransaction).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
                                    return (
                                        <tr
                                            key={item.coinId}
                                            className="hover:bg-zinc-800/40 transition-colors duration-150"
                                        >
                                            <td className="px-5 py-4 whitespace-nowrap text-left">
                                                <div className="font-medium text-sm text-zinc-50">
                                                    {item.coinName}
                                                </div>
                                                <div className="text-xs font-mono text-zinc-500 uppercase mt-0.5">
                                                    {item.coinSymbol}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right font-mono text-sm text-zinc-300">
                                                {item.transactionCount}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right">
                                                <div className="font-mono text-sm text-zinc-300">{item.totalBought.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                                                <div className="text-[10px] font-mono text-zinc-500 mt-1">${item.totalBuyValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right">
                                                <div className="font-mono text-sm text-zinc-300">{item.totalSold.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                                                <div className="text-[10px] font-mono text-zinc-500 mt-1">${item.totalSellValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right font-mono text-sm font-medium">
                                                <span className={item.netQuantity > 0 ? "text-emerald-500" : item.netQuantity === 0 ? "text-zinc-500" : "text-rose-500"}>
                                                    {item.netQuantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right font-mono text-sm text-zinc-300">
                                                ${item.avgBuyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right font-mono text-sm text-zinc-300">
                                                {item.totalSold > 0 ? `$${item.avgSellPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A"}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right text-xs text-zinc-500 font-mono">
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
