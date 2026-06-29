import type { HoldingStat, PortfolioStatsResponse } from "../types/portfolio.types";
import { useLivePrices } from "../context/LivePriceContext";
import { TableRowSkeleton } from "./common/Skeleton";

interface HoldingsTableProps {
    statsData?: PortfolioStatsResponse;
    onSelectCoin: (coinId: string) => void;
    isLoading?: boolean;
}

const HoldingsTable = ({ statsData, onSelectCoin, isLoading }: HoldingsTableProps) => {
    const holdings = statsData?.portfolio ?? [];
    const { livePrices } = useLivePrices();

    return (
        <div
            className="overflow-hidden mt-1 rounded-sm"
            style={{ background: "#2e3330", border: "1px solid rgba(61,74,62,0.3)" }}
        >
            <div className="p-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h3
                        className="font-light tracking-wide"
                        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#ede8dd" }}
                    >
                        Portfolio Holdings
                    </h3>
                    <p
                        className="mt-1"
                        style={{ fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#6b7c6a" }}
                    >
                        Allocation, cost basis, and return by coin
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr style={{ borderBottom: "1px solid rgba(61,74,62,0.3)" }}>
                            {["Coin", "Quantity", "Avg Cost", "Current Price", "Allocation", "Value", "Unrealized PnL", "Realized PnL", "Return"].map((h) => (
                                <th
                                    key={h}
                                    scope="col"
                                    className="px-6 py-4 text-left font-normal"
                                    style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b7c6a" }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {isLoading ? (
                            <>
                                <TableRowSkeleton columnsCount={9} />
                                <TableRowSkeleton columnsCount={9} />
                                <TableRowSkeleton columnsCount={9} />
                            </>
                        ) : (
                            <>
                                {holdings.map((holding: HoldingStat) => {
                                    const liveData = livePrices[holding.coinId];
                                    const currentPrice = liveData ? liveData.price : holding.currentPrice;
                                    const priceChange24h = liveData ? liveData.priceChange24h : holding.priceChange24h;
                                    const value = holding.quantity * currentPrice;
                                    const unrealizedProfit = value - holding.totalCost;
                                    const isProfit = unrealizedProfit > 0;
                                    const isLoss = unrealizedProfit < 0;
                                    const isRealizedProfit = (holding.realizedProfit ?? 0) > 0;
                                    const isRealizedLoss = (holding.realizedProfit ?? 0) < 0;
                                    const totalReturn = holding.totalCost > 0 ? (unrealizedProfit / holding.totalCost) * 100 : 0;

                                    return (
                                        <tr
                                            key={holding.coinId}
                                            className="group transition-colors duration-300"
                                            style={{ borderBottom: "1px solid rgba(61,74,62,0.15)" }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = "rgba(42,61,46,0.5)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "transparent";
                                            }}
                                        >
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectCoin(holding.coinId)}
                                                    style={{ background: "transparent", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}
                                                >
                                                    <div
                                                        className="font-light"
                                                        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#ede8dd", letterSpacing: "0.04em" }}
                                                    >
                                                        {holding.coinName}
                                                    </div>
                                                    <div style={{ fontSize: "0.52rem", letterSpacing: "0.2em", color: "#6b7c6a", textTransform: "uppercase" }}>
                                                        {holding.coinSymbol}
                                                    </div>
                                                </button>
                                            </td>

                                            <td className="px-6 py-5 whitespace-nowrap" style={{ fontSize: "0.7rem", letterSpacing: "0.06em", color: "#9aab97" }}>
                                                {holding.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                            </td>

                                            <td className="px-6 py-5 whitespace-nowrap" style={{ fontSize: "0.7rem", letterSpacing: "0.06em", color: "#9aab97" }}>
                                                ${holding.avgBuyPrice.toFixed(2)}
                                            </td>

                                            <td
                                                key={`${holding.coinId}-${liveData?.updateKey ?? 0}`}
                                                className={`px-6 py-5 whitespace-nowrap ${liveData?.direction === "up" ? "flash-up" : liveData?.direction === "down" ? "flash-down" : ""}`}
                                            >
                                                <div style={{ fontSize: "0.7rem", letterSpacing: "0.06em", color: "#9aab97" }}>
                                                    ${currentPrice.toFixed(2)}
                                                </div>
                                                <div style={{ fontSize: "0.5rem", letterSpacing: "0.15em", color: priceChange24h >= 0 ? "#587560" : "#8b5e3c" }}>
                                                    {priceChange24h >= 0 ? "+" : ""}
                                                    {priceChange24h.toFixed(2)}% 24H
                                                </div>
                                            </td>

                                            <td className="px-6 py-5 whitespace-nowrap" style={{ fontSize: "0.68rem", color: "#d4cfc4" }}>
                                                {holding.allocationPercent.toFixed(1)}%
                                            </td>

                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span
                                                    className="font-light"
                                                    style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", color: "#d4cfc4", letterSpacing: "0.04em" }}
                                                >
                                                    ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span
                                                    className="inline-flex items-center gap-1 px-3 py-1"
                                                    style={{
                                                        fontSize: "0.6rem",
                                                        letterSpacing: "0.15em",
                                                        fontFamily: "'DM Mono', monospace",
                                                        background: isProfit
                                                            ? "rgba(88,117,96,0.15)"
                                                            : isLoss
                                                                ? "rgba(139,94,60,0.15)"
                                                                : "rgba(107,124,106,0.1)",
                                                        color: isProfit ? "#587560" : isLoss ? "#8b5e3c" : "#6b7c6a",
                                                        border: `1px solid ${isProfit ? "rgba(88,117,96,0.3)" : isLoss ? "rgba(139,94,60,0.3)" : "rgba(107,124,106,0.2)"}`,
                                                    }}
                                                >
                                                    {unrealizedProfit >= 0 ? "+" : "-"}${Math.abs(unrealizedProfit).toFixed(2)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span
                                                    className="inline-flex items-center gap-1 px-3 py-1"
                                                    style={{
                                                        fontSize: "0.6rem",
                                                        letterSpacing: "0.15em",
                                                        fontFamily: "'DM Mono', monospace",
                                                        background: isRealizedProfit
                                                            ? "rgba(88,117,96,0.15)"
                                                            : isRealizedLoss
                                                                ? "rgba(139,94,60,0.15)"
                                                                : "rgba(107,124,106,0.1)",
                                                        color: isRealizedProfit ? "#587560" : isRealizedLoss ? "#8b5e3c" : "#6b7c6a",
                                                        border: `1px solid ${isRealizedProfit ? "rgba(88,117,96,0.3)" : isRealizedLoss ? "rgba(139,94,60,0.3)" : "rgba(107,124,106,0.2)"}`,
                                                    }}
                                                >
                                                    {(holding.realizedProfit ?? 0) >= 0 ? "+" : "-"}${Math.abs(holding.realizedProfit ?? 0).toFixed(2)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5 whitespace-nowrap" style={{ fontSize: "0.68rem", color: totalReturn >= 0 ? "#587560" : "#8b5e3c" }}>
                                                {totalReturn >= 0 ? "+" : ""}
                                                {totalReturn.toFixed(2)}%
                                            </td>
                                        </tr>
                                    );
                                })}

                                {holdings.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-20 text-center">
                                            <p
                                                className="font-light"
                                                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", color: "#6b7c6a", letterSpacing: "0.05em" }}
                                            >
                                                No holdings yet
                                            </p>
                                            <p style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#3d4a3e", marginTop: "8px" }}>
                                                Add a transaction or import your CSV to unlock allocation and performance views
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HoldingsTable;
