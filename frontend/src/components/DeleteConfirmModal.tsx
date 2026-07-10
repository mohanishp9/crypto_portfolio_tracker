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
        <div className="fixed inset-0 flex items-center justify-center z-[100] px-4 bg-surface-primary/80  animate-fade-in">
            <div className="w-full max-w-md bg-surface-secondary border border-border-primary rounded-sm shadow-2xl overflow-hidden animate-slide-up relative">
                
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-border-primary bg-surface-secondary/80 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-negative-subtle flex items-center justify-center shrink-0 border border-negative/20">
                        <AlertTriangle size={20} className="text-negative" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-negative mb-1 font-semibold">
                            Confirm removal
                        </p>
                        <h2 className="font-semibold text-xl text-text-primary tracking-tight">
                            Delete <span className="font-normal text-text-tertiary italic">{selectedTransaction.coinName} Transaction</span>
                        </h2>
                    </div>
                </div>

                {/* Body */}
                <div className="px-8 py-6">
                    <p className="text-sm text-text-tertiary leading-relaxed">
                        This transaction will be permanently removed from your history. This action cannot be undone and will immediately affect your portfolio analytics.
                    </p>
                </div>

                {/* Actions */}
                <div className="px-8 py-5 bg-surface-primary border-t border-border-primary flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-2.5 bg-transparent border border-border-secondary text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary rounded-sm text-xs font-semibold  transition-colors"
                    >
                        Keep it
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-negative border border-negative text-white hover:bg-negative hover:border-negative rounded-sm text-xs font-semibold  transition-colors disabled:opacity-50 disabled:cursor-not-allowed  shadow-negative/20"
                    >
                        {isLoading ? "Removing..." : "Remove"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;