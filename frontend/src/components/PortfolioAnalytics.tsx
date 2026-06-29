import { useState } from "react";
import { useGetPortfolioAnalyticsQuery } from "../services/portfolioApi";
import { TableRowSkeleton } from "./common/Skeleton";

const PortfolioAnalytics = () => {
    const { data, isLoading } = useGetPortfolioAnalyticsQuery();
    const [isOpen, setIsOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="mt-8 bg-[#2e3330] border border-[rgba(61,74,62,0.35)] overflow-hidden">
                <div className="p-6 bg-[#2a3d2e] flex items-center justify-between border-b border-[rgba(61,74,62,0.25)]">
                    <div>
                        <p style={{ fontSize: "0.52rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "#587560", marginBottom: "4px" }}>
                            Aggregated Data
                        </p>
                        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", fontWeight: 300, color: "#ede8dd", letterSpacing: "0.04em" }}>
                            MongoDB <span style={{ fontStyle: "italic", color: "#9aab97" }}>Aggregation Pipeline Analytics</span>
                        </h3>
                    </div>
                </div>
                <div className="p-6 overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr style={{ borderBottom: "1px solid rgba(61,74,62,0.3)" }}>
                                {["Asset", "Tx Count", "Total Bought", "Total Sold", "Net Position", "Avg Buy Price", "Avg Sell Price", "Traded Period"].map((h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-3 text-left font-normal"
                                        style={{ fontSize: "0.52rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#6b7c6a" }}
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

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="mt-8 bg-[#2e3330] border border-[rgba(61,74,62,0.35)]">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 bg-[#2a3d2e] hover:bg-[#344d3a] transition-colors duration-300 text-left focus:outline-none"
            >
                <div>
                    <p style={{ fontSize: "0.52rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "#587560", marginBottom: "4px" }}>
                        Aggregated Data
                    </p>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", fontWeight: 300, color: "#ede8dd", letterSpacing: "0.04em" }}>
                        MongoDB <span style={{ fontStyle: "italic", color: "#9aab97" }}>Aggregation Pipeline Analytics</span>
                    </h3>
                </div>
                <span style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#9aab97", fontFamily: "'DM Mono', monospace" }}>
                    {isOpen ? "Collapse [-]" : "Expand [+]"}
                </span>
            </button>

            {isOpen && (
                <div className="p-6 overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr style={{ borderBottom: "1px solid rgba(61,74,62,0.3)" }}>
                                {["Asset", "Tx Count", "Total Bought", "Total Sold", "Net Position", "Avg Buy Price", "Avg Sell Price", "Traded Period"].map((h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-3 text-left font-normal"
                                        style={{ fontSize: "0.52rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#6b7c6a" }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => {
                                const firstDate = new Date(item.firstTransaction).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
                                const lastDate = new Date(item.lastTransaction).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
                                return (
                                    <tr
                                        key={item.coinId}
                                        style={{ borderBottom: "1px solid rgba(61,74,62,0.15)" }}
                                        className="hover:bg-[rgba(42,61,46,0.3)] transition-colors duration-300"
                                    >
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#ede8dd" }}>
                                                {item.coinName}
                                            </div>
                                            <div style={{ fontSize: "0.52rem", letterSpacing: "0.2em", color: "#6b7c6a", textTransform: "uppercase" }}>
                                                {item.coinSymbol}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-[#9aab97]" style={{ fontFamily: "'DM Mono', monospace" }}>
                                            {item.transactionCount} trades
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-[#9aab97]">
                                            <div style={{ fontFamily: "'DM Mono', monospace" }}>{item.totalBought.toLocaleString(undefined, { maximumFractionDigits: 4 })} {item.coinSymbol.toUpperCase()}</div>
                                            <div className="text-[10px] text-[#6b7c6a]" style={{ fontFamily: "'DM Mono', monospace" }}>${item.totalBuyValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-[#9aab97]">
                                            <div style={{ fontFamily: "'DM Mono', monospace" }}>{item.totalSold.toLocaleString(undefined, { maximumFractionDigits: 4 })} {item.coinSymbol.toUpperCase()}</div>
                                            <div className="text-[10px] text-[#6b7c6a]" style={{ fontFamily: "'DM Mono', monospace" }}>${item.totalSellValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-xs" style={{ color: item.netQuantity > 0 ? "#587560" : item.netQuantity === 0 ? "#9aab97" : "#8b5e3c", fontFamily: "'DM Mono', monospace" }}>
                                            {item.netQuantity.toLocaleString(undefined, { maximumFractionDigits: 4 })} {item.coinSymbol.toUpperCase()}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-[#9aab97]" style={{ fontFamily: "'DM Mono', monospace" }}>
                                            ${item.avgBuyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-[#9aab97]" style={{ fontFamily: "'DM Mono', monospace" }}>
                                            {item.totalSold > 0 ? `$${item.avgSellPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A"}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-[10px] text-[#6b7c6a]" style={{ fontFamily: "'DM Mono', monospace" }}>
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
    );
};

export default PortfolioAnalytics;
