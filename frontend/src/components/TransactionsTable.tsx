import { TableRowSkeleton } from "./common/Skeleton";
import type { Transaction } from "../types/portfolio.types";
import { Edit2, Trash2 } from "lucide-react";

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
        <div className="overflow-hidden mt-8 rounded-sm bg-surface-secondary border border-border-primary">
            <div className="px-5 py-5 flex flex-wrap justify-between items-center gap-4 border-b border-border-primary bg-surface-secondary">
                <div>
                    <h3 className="font-semibold text-lg text-text-primary tracking-tight">
                        Transaction History
                    </h3>
                    <p className="mt-1 text-xs text-text-secondary">
                        Ledger
                    </p>
                </div>
                <div>
                    <input
                        type="text"
                        placeholder="Search ledger..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-48 sm:w-64 px-3 py-2 bg-surface-primary border border-border-primary rounded-sm text-text-primary placeholder-text-tertiary text-sm focus:outline-none focus:border-accent transition-colors"
                    />
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-border-primary bg-surface-secondary/50">
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-text-secondary ">
                                Date
                            </th>
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-text-secondary ">
                                Type
                            </th>
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-text-secondary ">
                                Coin
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-text-secondary ">
                                Quantity
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-text-secondary ">
                                Price
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-text-secondary ">
                                Fee
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-text-secondary ">
                                Total
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-text-secondary ">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-primary/50">
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
                                            className="group transition-colors duration-150 hover:bg-surface-tertiary"
                                        >
                                            <td className="px-5 py-3 whitespace-nowrap text-sm text-text-secondary">
                                                {date}
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-sm font-mono text-xs font-semibold  bg-surface-primary border ${isBuy ? "text-positive border-positive/20" : "text-negative border-negative/20"}`}>
                                                    {tx.type}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="font-medium text-sm text-text-primary group-hover:text-white transition-colors">
                                                    {tx.coinName}
                                                </div>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right font-mono text-sm text-text-secondary">
                                                {tx.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right font-mono text-sm text-text-secondary">
                                                ${tx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right font-mono text-sm text-text-secondary">
                                                ${(tx.fee ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right font-mono text-sm font-medium text-text-primary">
                                                ${(tx.price * tx.quantity + (tx.fee ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => handleEdit(tx)}
                                                        className="text-text-tertiary hover:text-accent transition-colors"
                                                        title="Edit Transaction"
                                                    >
                                                        <Edit2 size={16} strokeWidth={1.5} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(tx)}
                                                        className="text-text-tertiary hover:text-negative transition-colors"
                                                        title="Delete Transaction"
                                                    >
                                                        <Trash2 size={16} strokeWidth={1.5} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-12 text-center text-sm text-text-tertiary">
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
                <div className="px-5 py-4 flex flex-wrap justify-between items-center gap-4 border-t border-border-primary bg-surface-secondary/50">
                    <span className="text-xs text-text-tertiary font-mono">
                        Showing page {currentPage} of {totalPages} ({totalCount} total)
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => onPageChange(currentPage - 1)}
                            className="px-3 py-1.5 bg-surface-primary border border-border-primary rounded-sm text-xs text-text-secondary hover:text-text-primary hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed  transition-colors"
                        >
                            Prev
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => onPageChange(currentPage + 1)}
                            className="px-3 py-1.5 bg-surface-primary border border-border-primary rounded-sm text-xs text-text-secondary hover:text-text-primary hover:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed  transition-colors"
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
