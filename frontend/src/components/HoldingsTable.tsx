import type { Holding } from "../types/portfolio.types";

interface HoldingsTableProps {
    portfolioData: any;
    statsData: any;
    handleEdit: (holding: Holding) => void;
    handleDelete: (holding: Holding) => void;
}

const HoldingsTable = ({
    portfolioData,
    statsData,
    handleEdit,
    handleDelete,
}: HoldingsTableProps) => {
    const holdings = portfolioData?.portfolio?.holdings ?? [];

    return (
        <div
            className="overflow-hidden mt-1 rounded-sm"
            style={{ background: "#2e3330", border: "1px solid rgba(61,74,62,0.3)" }}
        >
            {/* Header */}
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
                    Real-time positions
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full">

                    {/* THEAD */}
                    <thead>
                        <tr style={{ borderBottom: "1px solid rgba(61,74,62,0.3)" }}>
                            {["Coin", "Quantity", "Buy Price", "Current Price", "Value", "Profit / Loss", "Actions"].map((h) => (
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

                    {/* TBODY */}
                    <tbody>
                        {portfolioData?.portfolio.holdings.map((holding) => {
                            const currentPrice = statsData?.prices?.[holding.coinId]?.usd ?? 0;
                            const value = holding.quantity * currentPrice;
                            const profitLoss = value - holding.quantity * holding.buyPrice;
                            const isProfit = profitLoss > 0;
                            const isLoss = profitLoss < 0;

                            return (
                                <tr
                                    key={holding._id}
                                    className="group transition-colors duration-300"
                                    style={{ borderBottom: "1px solid rgba(61,74,62,0.15)" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(42,61,46,0.5)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >

                                    {/* Coin */}
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div
                                            className="font-light"
                                            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#ede8dd", letterSpacing: "0.04em" }}
                                        >
                                            {holding.coinName}
                                        </div>
                                        <div style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "#6b7c6a", marginTop: "2px" }}>
                                            {holding.coinSymbol.toUpperCase()}
                                        </div>
                                    </td>

                                    {/* Quantity */}
                                    <td className="px-6 py-5 whitespace-nowrap" style={{ fontSize: "0.7rem", letterSpacing: "0.06em", color: "#9aab97" }}>
                                        {holding.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                    </td>

                                    {/* Buy Price */}
                                    <td className="px-6 py-5 whitespace-nowrap" style={{ fontSize: "0.7rem", letterSpacing: "0.06em", color: "#9aab97" }}>
                                        ${holding.buyPrice.toFixed(2)}
                                    </td>

                                    {/* Current Price */}
                                    <td className="px-6 py-5 whitespace-nowrap" style={{ fontSize: "0.7rem", letterSpacing: "0.06em", color: "#9aab97" }}>
                                        ${currentPrice.toFixed(2)}
                                    </td>

                                    {/* Value */}
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span
                                            className="font-light"
                                            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", color: "#d4cfc4", letterSpacing: "0.04em" }}
                                        >
                                            ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>

                                    {/* Profit / Loss badge */}
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
                                            {isProfit ? "+" : isLoss ? "−" : ""}
                                            ${Math.abs(profitLoss).toFixed(2)}
                                            <span style={{ fontSize: "0.5rem", opacity: 0.7 }}>
                                                {isProfit ? "▲" : isLoss ? "▼" : "—"}
                                            </span>
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleEdit(holding)}
                                                className="text-[0.6rem] tracking-[0.2em] uppercase text-[#7fa8b4] hover:text-[#ede8dd] transition-colors duration-200"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(holding)}
                                                className="text-[0.6rem] tracking-[0.2em] uppercase text-[#8b5e3c] hover:text-[#c4885a] transition-colors duration-200"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>

                                </tr>
                            );
                        })}

                        {/* Empty state */}
                        {(!portfolioData?.portfolio.holdings || portfolioData.portfolio.holdings.length === 0) && (
                            <tr>
                                <td colSpan={7} className="px-6 py-20 text-center">
                                    <svg
                                        className="mx-auto mb-5"
                                        style={{ width: 36, height: 36, color: "#3d4a3e" }}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={0.8}
                                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <p
                                        className="font-light"
                                        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", color: "#6b7c6a", letterSpacing: "0.05em" }}
                                    >
                                        No holdings yet
                                    </p>
                                    <p style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#3d4a3e", marginTop: "8px" }}>
                                        Add your first coin to begin
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
