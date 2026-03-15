import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../app/store";
import { useDeleteTransactionMutation } from "../services/portfolioApi";
import { closeDeleteModal, clearSelectedTransaction } from "../features/portfolio/portfolioSlice";

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
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: "rgba(26,28,26,0.85)", backdropFilter: "blur(6px)" }}
        >
            <div
                className="w-full max-w-sm"
                style={{ background: "#2e3330", border: "1px solid rgba(139,94,60,0.2)" }}
            >
                {/* Header */}
                <div
                    className="px-7 py-5"
                    style={{ borderBottom: "1px solid rgba(139,94,60,0.15)", background: "rgba(139,94,60,0.06)" }}
                >
                    <p style={{ fontSize: "0.55rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "#8b5e3c", marginBottom: "6px" }}>
                        Confirm removal
                    </p>
                    <h2
                        className="font-light"
                        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#ede8dd", letterSpacing: "0.04em" }}
                    >
                        Delete <span style={{ fontStyle: "italic", color: "#c4885a" }}>{selectedTransaction.coinName} Transaction</span>
                    </h2>
                </div>

                {/* Body */}
                <div className="px-7 py-6">
                    <p style={{ fontSize: "0.65rem", letterSpacing: "0.08em", color: "#6b7c6a", lineHeight: 1.8 }}>
                        This transaction will be permanently removed from your history. This action cannot be undone.
                    </p>
                </div>

                {/* Actions */}
                <div
                    className="px-7 pb-7 flex justify-end gap-3"
                    style={{ borderTop: "1px solid rgba(61,74,62,0.15)", paddingTop: "20px" }}
                >
                    <button
                        type="button"
                        onClick={handleCancel}
                        style={{
                            background: "transparent",
                            border: "1px solid rgba(107,124,106,0.25)",
                            color: "#6b7c6a",
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "0.58rem",
                            letterSpacing: "0.25em",
                            textTransform: "uppercase",
                            padding: "9px 22px",
                            cursor: "pointer",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#9aab97"; e.currentTarget.style.borderColor = "rgba(154,171,151,0.4)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "#6b7c6a"; e.currentTarget.style.borderColor = "rgba(107,124,106,0.25)"; }}
                    >
                        Keep it
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isLoading}
                        style={{
                            background: isLoading ? "rgba(139,94,60,0.2)" : "transparent",
                            border: "1px solid rgba(139,94,60,0.4)",
                            color: "#8b5e3c",
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "0.58rem",
                            letterSpacing: "0.25em",
                            textTransform: "uppercase",
                            padding: "9px 22px",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            transition: "all 0.25s",
                        }}
                        onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.background = "#8b5e3c"; e.currentTarget.style.color = "#ede8dd"; } }}
                        onMouseLeave={e => { if (!isLoading) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8b5e3c"; } }}
                    >
                        {isLoading ? "Removing..." : "Remove"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;