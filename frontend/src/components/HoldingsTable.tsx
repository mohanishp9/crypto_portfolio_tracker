import type { HoldingStat, PortfolioStatsResponse } from "../types/portfolio.types";

interface HoldingsTableProps {
    statsData?: PortfolioStatsResponse;
    onSelectCoin: (coinId: string) => void;
}

const HoldingsTable = ({ statsData, onSelectCoin }: HoldingsTableProps) => {
    const holdings = statsData?.portfolio ?? [];

    return (
        <div
            className="overflow-hidden mt-1 rounded-sm"
            style={{ background: "#2e3330", border: "1px solid rgba(61,74,62,0.3)" }}
        >
            <div
                className="px-6 py-5"
                style={{ borderBottom: "1px solid rgba(61,74,62,0.25)", background: "#2a3d2e" }}
            >
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

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr style={{ borderBottom: "1px solid rgba(61,74,62,0.3)" }}>
                            {["Coin", "Quantity", "Avg Cost", "Current Price", "Allocation", "Value", "Unrealized PnL", "Return"].map((h) => (
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
                        {holdings.map((holding: HoldingStat) => {
                            const isProfit = holding.unrealizedProfit > 0;
                            const isLoss = holding.unrealizedProfit < 0;

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

                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div style={{ fontSize: "0.7rem", letterSpacing: "0.06em", color: "#9aab97" }}>
                                            ${holding.currentPrice.toFixed(2)}
                                        </div>
                                        <div style={{ fontSize: "0.5rem", letterSpacing: "0.15em", color: holding.priceChange24h >= 0 ? "#587560" : "#8b5e3c" }}>
                                            {holding.priceChange24h >= 0 ? "+" : ""}
                                            {holding.priceChange24h.toFixed(2)}% 24H
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
                                            ${holding.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                                            {holding.unrealizedProfit >= 0 ? "+" : "-"}${Math.abs(holding.unrealizedProfit).toFixed(2)}
                                        </span>
                                    </td>

                                    <td className="px-6 py-5 whitespace-nowrap" style={{ fontSize: "0.68rem", color: holding.totalReturn >= 0 ? "#587560" : "#8b5e3c" }}>
                                        {holding.totalReturn >= 0 ? "+" : ""}
                                        {holding.totalReturn.toFixed(2)}%
                                    </td>
                                </tr>
                            );
                        })}

                        {holdings.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-20 text-center">
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
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HoldingsTable;
