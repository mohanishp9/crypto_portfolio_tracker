import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../app/store";
import { useEffect, useState } from "react";
import { useUpdateHoldingMutation } from "../services/portfolioApi";
import { clearSelectedHolding, closeEditModal } from "../features/portfolio/portfolioSlice";

const EditHoldingModal = () => {
    const dispatch = useDispatch();
    const isEditOpen = useSelector((state: RootState) => state.portfolio.isEditModalOpen);
    const selectedHolding = useSelector((state: RootState) => state.portfolio.selectedHolding);
    const [updateHolding, { isLoading }] = useUpdateHoldingMutation();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        quantity: selectedHolding?.quantity || 0,
        buyPrice: selectedHolding?.buyPrice || 0,
    });

    if (!isEditOpen || !selectedHolding) return null;

    useEffect(() => {
        if (selectedHolding) {
            setFormData({ quantity: selectedHolding.quantity, buyPrice: selectedHolding.buyPrice });
        }
    }, [selectedHolding]);

    const handleUpdateHolding = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        try {
            await updateHolding({
                holdingId: selectedHolding._id,
                quantity: formData.quantity,
                buyPrice: formData.buyPrice,
            }).unwrap();
            dispatch(closeEditModal());
        } catch (error: any) {
            setErrorMessage(
                JSON.stringify(error?.data?.errors || error?.data?.message || "Failed to update holding")
            );
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: Number(e.target.value) });
    };

    const isUnchanged =
        formData.quantity === selectedHolding.quantity &&
        formData.buyPrice === selectedHolding.buyPrice;

    const handleClose = () => {
        dispatch(clearSelectedHolding());
        dispatch(closeEditModal());
    };

    const inputStyle = {
        width: "100%",
        background: "#1a1c1a",
        border: "1px solid rgba(61,74,62,0.4)",
        color: "#ede8dd",
        fontFamily: "'DM Mono', monospace",
        fontSize: "0.72rem",
        padding: "11px 14px",
        outline: "none",
        letterSpacing: "0.05em",
    } as React.CSSProperties;

    const labelStyle = {
        display: "block",
        fontSize: "0.55rem",
        letterSpacing: "0.3em",
        textTransform: "uppercase" as const,
        color: "#6b7c6a",
        marginBottom: "8px",
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: "rgba(26,28,26,0.85)", backdropFilter: "blur(6px)" }}
        >
            <div
                className="w-full max-w-md"
                style={{ background: "#2e3330", border: "1px solid rgba(61,74,62,0.35)" }}
            >
                {/* Header */}
                <div
                    className="px-8 py-5 flex items-center justify-between"
                    style={{ borderBottom: "1px solid rgba(61,74,62,0.25)", background: "#2a3d2e" }}
                >
                    <div>
                        <p style={{ fontSize: "0.55rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "#587560" }}>
                            {selectedHolding.coinSymbol.toUpperCase()}
                        </p>
                        <h2
                            className="font-light mt-1"
                            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", color: "#ede8dd", letterSpacing: "0.04em" }}
                        >
                            Edit <span style={{ fontStyle: "italic", color: "#9aab97" }}>{selectedHolding.coinName}</span>
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        style={{ background: "none", border: "none", color: "#6b7c6a", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1, padding: "4px" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#ede8dd"}
                        onMouseLeave={e => e.currentTarget.style.color = "#6b7c6a"}
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleUpdateHolding} className="px-8 py-7 space-y-6">

                    <div>
                        <label htmlFor="quantity" style={labelStyle}>Quantity</label>
                        <input
                            type="number"
                            id="quantity"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            style={inputStyle}
                            onFocus={e => e.currentTarget.style.borderColor = "rgba(196,136,90,0.5)"}
                            onBlur={e => e.currentTarget.style.borderColor = "rgba(61,74,62,0.4)"}
                        />
                    </div>

                    <div>
                        <label htmlFor="buyPrice" style={labelStyle}>
                            Buy Price <span style={{ color: "#3d4a3e" }}>/ USD</span>
                        </label>
                        <input
                            type="number"
                            id="buyPrice"
                            name="buyPrice"
                            value={formData.buyPrice}
                            onChange={handleChange}
                            style={inputStyle}
                            onFocus={e => e.currentTarget.style.borderColor = "rgba(196,136,90,0.5)"}
                            onBlur={e => e.currentTarget.style.borderColor = "rgba(61,74,62,0.4)"}
                        />
                    </div>

                    {/* Error */}
                    {errorMessage && (
                        <div
                            style={{
                                padding: "10px 14px",
                                background: "rgba(139,94,60,0.1)",
                                border: "1px solid rgba(139,94,60,0.25)",
                                fontSize: "0.6rem",
                                letterSpacing: "0.1em",
                                color: "#8b5e3c",
                            }}
                        >
                            {errorMessage}
                        </div>
                    )}

                    {/* Actions */}
                    <div
                        className="flex justify-end gap-3"
                        style={{ borderTop: "1px solid rgba(61,74,62,0.2)", paddingTop: "20px" }}
                    >
                        <button
                            type="button"
                            onClick={handleClose}
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
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || isUnchanged}
                            style={{
                                background: "transparent",
                                border: `1px solid ${isUnchanged ? "rgba(61,74,62,0.2)" : "rgba(127,168,180,0.4)"}`,
                                color: isUnchanged ? "#3d4a3e" : "#7fa8b4",
                                fontFamily: "'DM Mono', monospace",
                                fontSize: "0.58rem",
                                letterSpacing: "0.25em",
                                textTransform: "uppercase",
                                padding: "9px 22px",
                                cursor: isLoading || isUnchanged ? "not-allowed" : "pointer",
                                transition: "all 0.25s",
                            }}
                            onMouseEnter={e => { if (!isLoading && !isUnchanged) { e.currentTarget.style.background = "#7fa8b4"; e.currentTarget.style.color = "#1a1c1a"; } }}
                            onMouseLeave={e => { if (!isLoading && !isUnchanged) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#7fa8b4"; } }}
                        >
                            {isLoading ? "Updating..." : "Save Changes"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default EditHoldingModal;