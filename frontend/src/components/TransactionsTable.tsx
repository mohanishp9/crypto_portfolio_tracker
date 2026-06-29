import { TableRowSkeleton } from "./common/Skeleton";
import type { Transaction } from "../types/portfolio.types";

interface TransactionsTableProps {
    transactions: Transaction[];
    handleEdit: (transaction: Transaction) => void;
    handleDelete: (transaction: Transaction) => void;
    currentPage: number;
    totalPages: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    searchQuery: string;
    onSearchChange: (search: string) => void;
    isLoading?: boolean;
}

const TransactionsTable = ({
    transactions,
    handleEdit,
    handleDelete,
    currentPage,
    totalPages,
    totalCount,
    onPageChange,
    searchQuery,
    onSearchChange,
    isLoading,
}: TransactionsTableProps) => {

    return (
        <div
            className="overflow-hidden mt-8 rounded-sm"
            style={{ background: "#2e3330", border: "1px solid rgba(61,74,62,0.3)" }}
        >
            <div
                className="px-6 py-5 flex flex-wrap justify-between items-center gap-4"
                style={{ borderBottom: "1px solid rgba(61,74,62,0.25)", background: "#2a3d2e" }}
            >
                <div>
                    <h3
                        className="font-light tracking-wide"
                        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#ede8dd" }}
                    >
                        Transaction History
                    </h3>
                    <p
                        className="mt-1"
                        style={{ fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#6b7c6a" }}
                    >
                        Ledger
                    </p>
                </div>
                <div>
                    <input
                        type="text"
                        placeholder="Search ledger..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="px-3 py-1.5 bg-[#1f2320] border border-[#3d4a3e]/30 text-[#ede8dd] placeholder-[#6b7c6a] text-xs focus:outline-none focus:border-[#587560]"
                        style={{ width: "200px" }}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr style={{ borderBottom: "1px solid rgba(61,74,62,0.3)" }}>
                            {["Date", "Type", "Coin", "Quantity", "Price", "Fee", "Total", "Actions"].map((h) => (
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
                                <TableRowSkeleton columnsCount={8} />
                                <TableRowSkeleton columnsCount={8} />
                                <TableRowSkeleton columnsCount={8} />
                            </>
                        ) : (
                            <>
                                {transactions.map((tx: Transaction) => {
                                    const isBuy = tx.type === "BUY";
                                    const date = new Date(tx.timestamp || tx.createdAt || "").toLocaleDateString();

                                    return (
                                        <tr
                                            key={tx._id}
                                            className="group transition-colors duration-300"
                                            style={{ borderBottom: "1px solid rgba(61,74,62,0.15)" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(42,61,46,0.5)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                        >
                                            <td className="px-6 py-5 whitespace-nowrap" style={{ fontSize: "0.7rem", letterSpacing: "0.06em", color: "#9aab97" }}>
                                                {date}
                                            </td>

                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span
                                                    style={{
                                                        fontSize: "0.6rem",
                                                        letterSpacing: "0.15em",
                                                        fontFamily: "'DM Mono', monospace",
                                                        background: isBuy ? "rgba(88,117,96,0.15)" : "rgba(139,94,60,0.15)",
                                                        color: isBuy ? "#587560" : "#8b5e3c",
                                                        padding: "4px 8px",
                                                        borderRadius: "4px",
                                                    }}
                                                >
                                                    {tx.type}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div
                                                    className="font-light"
                                                    style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#ede8dd", letterSpacing: "0.04em" }}
                                                >
                                                    {tx.coinName}
                                                </div>
                                            </td>

                                            <td className="px-6 py-5 whitespace-nowrap" style={{ fontSize: "0.7rem", letterSpacing: "0.06em", color: "#9aab97" }}>
                                                {tx.quantity}
                                            </td>

                                            <td className="px-6 py-5 whitespace-nowrap" style={{ fontSize: "0.7rem", letterSpacing: "0.06em", color: "#9aab97" }}>
                                                ${tx.price.toFixed(2)}
                                            </td>

                                            <td className="px-6 py-5 whitespace-nowrap" style={{ fontSize: "0.7rem", letterSpacing: "0.06em", color: "#9aab97" }}>
                                                ${(tx.fee ?? 0).toFixed(2)}
                                            </td>

                                            <td className="px-6 py-5 whitespace-nowrap" style={{ fontSize: "0.7rem", letterSpacing: "0.06em", color: "#d4cfc4" }}>
                                                ${(tx.price * tx.quantity + (tx.fee ?? 0)).toFixed(2)}
                                            </td>

                                            <td className="px-6 py-5 whitespace-nowrap flex gap-4">
                                                <button
                                                    onClick={() => handleEdit(tx)}
                                                    className="text-[0.6rem] tracking-[0.2em] uppercase text-[#9aab97] hover:text-[#ede8dd] transition-colors duration-200"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tx)}
                                                    className="text-[0.6rem] tracking-[0.2em] uppercase text-[#8b5e3c] hover:text-[#c4885a] transition-colors duration-200"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-10 text-center" style={{ color: "#6b7c6a", fontSize: "0.8rem", letterSpacing: "0.05em" }}>
                                            {searchQuery ? "No transactions matched your search criteria." : "No transactions recorded. Import a CSV or add your first trade to start building your history."}
                                        </td>
                                    </tr>
                                )}
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div
                    className="px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-t border-[rgba(61,74,62,0.15)]"
                    style={{ background: "#2a3d2e" }}
                >
                    <span style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7c6a" }}>
                        Showing page {currentPage} of {totalPages} ({totalCount} total)
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => onPageChange(currentPage - 1)}
                            className="px-3 py-1 bg-[#1f2320] border border-[#3d4a3e]/30 text-xs text-[#9aab97] hover:text-[#ede8dd] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                        >
                            Prev
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => onPageChange(currentPage + 1)}
                            className="px-3 py-1 bg-[#1f2320] border border-[#3d4a3e]/30 text-xs text-[#9aab97] hover:text-[#ede8dd] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionsTable;
