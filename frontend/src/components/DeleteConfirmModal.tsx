import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../app/store";
import { useDeleteTransactionMutation } from "../services/portfolioApi";
import { closeDeleteModal, clearSelectedTransaction } from "../features/portfolio/portfolioSlice";
import { AlertTriangle } from "lucide-react";

const DeleteConfirmModal = () => {
    const dispatch = useDispatch();
    const [deleteTransaction, { isLoading }] = useDeleteTransactionMutation();
    const selectedTransaction = useSelector((state: RootState) => state.portfolio.selectedTransaction);
    const isDeleteModalOpen = useSelector((state: RootState) => state.portfolio.isDeleteModalOpen);

    if (!isDeleteModalOpen || !selectedTransaction) return null;

    const handleDelete = async () => {
        if (!selectedTransaction?._id) return;
        try {
            await deleteTransaction(selectedTransaction._id).unwrap();
            dispatch(closeDeleteModal());
            dispatch(clearSelectedTransaction());
        } catch (err) {
            console.error(err);
        }
    };

    const handleCancel = () => {
        dispatch(closeDeleteModal());
        dispatch(clearSelectedTransaction());
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[100] px-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-up relative">
                
                {/* Danger glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="px-8 py-6 border-b border-zinc-800 bg-zinc-900/80 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
                        <AlertTriangle size={20} className="text-rose-500" />
                    </div>
                    <div>
                        <p className="text-[10px] tracking-widest uppercase text-rose-500 mb-1 font-semibold">
                            Confirm removal
                        </p>
                        <h2 className="font-semibold text-xl text-zinc-50 tracking-tight">
                            Delete <span className="font-normal text-zinc-500 italic">{selectedTransaction.coinName} Transaction</span>
                        </h2>
                    </div>
                </div>

                {/* Body */}
                <div className="px-8 py-6">
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        This transaction will be permanently removed from your history. This action cannot be undone and will immediately affect your portfolio analytics.
                    </p>
                </div>

                {/* Actions */}
                <div className="px-8 py-5 bg-zinc-950 border-t border-zinc-800 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-2.5 bg-transparent border border-zinc-700 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
                    >
                        Keep it
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-rose-500 border border-rose-500 text-white hover:bg-rose-600 hover:border-rose-600 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-rose-500/20"
                    >
                        {isLoading ? "Removing..." : "Remove"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;