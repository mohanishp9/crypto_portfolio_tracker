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
        <div className="brutalist-card p-0 overflow-hidden mt-8">
            <div className="px-5 py-5 flex flex-wrap justify-between items-center gap-4 border-b-4 border-black bg-white">
                <div>
                    <h3 className="font-black text-2xl text-black tracking-tighter uppercase">
                        Transaction History
                    </h3>
                    <p className="mt-1 text-sm font-mono font-bold text-black uppercase">
                        Ledger
                    </p>
                </div>
                <div>
                    <input
                        type="text"
                        placeholder="Search ledger..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-48 sm:w-64 px-3 py-2 bg-white border-4 border-black text-black font-mono font-bold uppercase placeholder-black focus:outline-none focus:bg-[#ccff00] transition-colors"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b-4 border-black bg-[#f4f4f0]">
                            <th scope="col" className="px-5 py-3 text-left text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">
                                Date
                            </th>
                            <th scope="col" className="px-5 py-3 text-left text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">
                                Type
                            </th>
                            <th scope="col" className="px-5 py-3 text-left text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">
                                Coin
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">
                                Quantity
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">
                                Price
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">
                                Fee
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-sm font-black text-black uppercase tracking-wider border-r-2 border-black">
                                Total
                            </th>
                            <th scope="col" className="px-5 py-3 text-right text-sm font-black text-black uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-black">
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
                                            className="group transition-colors duration-150 hover:bg-[#ccff00] bg-white"
                                        >
                                            <td className="px-5 py-3 whitespace-nowrap text-sm font-mono font-bold text-black border-r-2 border-black">
                                                {date}
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap border-r-2 border-black">
                                                <span className={`inline-flex items-center px-2 py-0.5 font-mono text-xs font-black uppercase tracking-wider border-2 border-black ${isBuy ? "bg-[#ccff00] text-black" : "bg-[#ff3333] text-white"}`}>
                                                    {tx.type}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap border-r-2 border-black">
                                                <div className="font-black text-sm text-black uppercase">
                                                    {tx.coinName}
                                                </div>
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right font-mono font-bold text-sm text-black border-r-2 border-black">
                                                {tx.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right font-mono font-bold text-sm text-black border-r-2 border-black">
                                                ${tx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right font-mono font-bold text-sm text-black border-r-2 border-black">
                                                ${(tx.fee ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right font-mono font-black text-sm text-black border-r-2 border-black">
                                                ${(tx.price * tx.quantity + (tx.fee ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>

                                            <td className="px-5 py-3 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => handleEdit(tx)}
                                                        className="text-black hover:text-blue-700 transition-colors bg-white border-2 border-black p-1 hover:bg-[#ccff00]"
                                                        title="Edit Transaction"
                                                    >
                                                        <Edit2 size={16} strokeWidth={2.5} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(tx)}
                                                        className="text-black hover:text-red-600 transition-colors bg-white border-2 border-black p-1 hover:bg-[#ccff00]"
                                                        title="Delete Transaction"
                                                    >
                                                        <Trash2 size={16} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-12 text-center text-sm font-mono font-bold text-black uppercase">
                                            {searchQuery ? "NO TRANSACTIONS MATCHED YOUR SEARCH CRITERIA." : "NO TRANSACTIONS RECORDED. IMPORT A CSV OR ADD YOUR FIRST TRADE."}
                                        </td>
                                    </tr>
                                )}
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="px-5 py-4 flex flex-wrap justify-between items-center gap-4 border-t-4 border-black bg-white">
                    <span className="text-sm font-black uppercase text-black">
                        Showing page {currentPage} of {totalPages} ({totalCount} total)
                    </span>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => onPageChange(currentPage - 1)}
                            className="brutalist-btn px-4 py-2 bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            PREV
                        </button>
                        <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => onPageChange(currentPage + 1)}
                            className="brutalist-btn px-4 py-2 bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            NEXT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionsTable;
