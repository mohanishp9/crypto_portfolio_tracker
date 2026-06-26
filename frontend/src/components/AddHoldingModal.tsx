import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../app/store";
import useDebounce from "../hooks/useDebounce";
import {
    useAddTransactionMutation,
    useSearchCoinsQuery,
    useUpdateTransactionMutation,
} from "../services/portfolioApi";
import { clearSelectedTransaction, closeAddModal } from "../features/portfolio/portfolioSlice";
import type { TransactionType } from "../types/portfolio.types";

const AddHoldingModal = () => {
    const dispatch = useDispatch();
    const isOpen = useSelector((state: RootState) => state.portfolio.isAddModalOpen);
    const selectedTransaction = useSelector((state: RootState) => state.portfolio.selectedTransaction);
    const isEditing = Boolean(selectedTransaction?._id);
    const [addTransaction, { isLoading: isAdding }] = useAddTransactionMutation();
    const [updateTransaction, { isLoading: isUpdating }] = useUpdateTransactionMutation();

    const [coinInput, setCoinInput] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const debouncedCoin = useDebounce(coinInput);
    const { data: coins } = useSearchCoinsQuery(debouncedCoin, {
        skip: debouncedCoin.length < 2 || isEditing,
    });

    const [formData, setFormData] = useState({
        coinId: "",
        coinName: "",
        coinSymbol: "",
        quantity: "",
        price: "",
        fee: "",
        type: "BUY" as TransactionType,
        timestamp: new Date().toISOString().slice(0, 16),
    });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        if (selectedTransaction) {
            setFormData({
                coinId: selectedTransaction.coinId,
                coinName: selectedTransaction.coinName,
                coinSymbol: selectedTransaction.coinSymbol,
                quantity: String(selectedTransaction.quantity),
                price: String(selectedTransaction.price),
                fee: String(selectedTransaction.fee ?? 0),
                type: selectedTransaction.type,
                timestamp: new Date(selectedTransaction.timestamp).toISOString().slice(0, 16),
            });
            setCoinInput(selectedTransaction.coinName);
        } else {
            setFormData({
                coinId: "",
                coinName: "",
                coinSymbol: "",
                quantity: "",
                price: "",
                fee: "",
                type: "BUY",
                timestamp: new Date().toISOString().slice(0, 16),
            });
            setCoinInput("");
        }
        setErrorMessage(null);
        setShowDropdown(false);
    }, [isOpen, selectedTransaction]);

    if (!isOpen) return null;

    const isLoading = isAdding || isUpdating;

    const handleClose = () => {
        dispatch(closeAddModal());
        dispatch(clearSelectedTransaction());
    };

    const handleCoinSelect = (coin: { id: string; name: string; symbol: string }) => {
        setFormData((prev) => ({
            ...prev,
            coinId: coin.id,
            coinName: coin.name,
            coinSymbol: coin.symbol,
        }));
        setCoinInput(coin.name);
        setShowDropdown(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        const payload = {
            ...formData,
            quantity: Number(formData.quantity),
            price: Number(formData.price),
            fee: formData.fee ? Number(formData.fee) : 0,
            timestamp: new Date(formData.timestamp).toISOString(),
        };

        if (!payload.coinId || payload.quantity <= 0 || payload.price <= 0) {
            setErrorMessage("Choose a coin and enter valid quantity and price.");
            return;
        }

        try {
            if (selectedTransaction?._id) {
                await updateTransaction({ id: selectedTransaction._id, transaction: payload }).unwrap();
            } else {
                await addTransaction(payload).unwrap();
            }
            handleClose();
        } catch (err: any) {
            setErrorMessage(err?.data?.message || err?.error || "Failed to save transaction.");
        }
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        background: "#1a1c1a",
        border: "1px solid rgba(61,74,62,0.4)",
        color: "#ede8dd",
        fontFamily: "'DM Mono', monospace",
        fontSize: "0.72rem",
        padding: "11px 14px",
        outline: "none",
        letterSpacing: "0.05em",
    };

    const labelStyle: React.CSSProperties = {
        display: "block",
        fontSize: "0.55rem",
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        color: "#6b7c6a",
        marginBottom: "8px",
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            style={{ background: "rgba(26,28,26,0.85)", backdropFilter: "blur(6px)" }}
        >
            <div className="w-full max-w-xl" style={{ background: "#2e3330", border: "1px solid rgba(61,74,62,0.35)" }}>
                <div
                    className="px-8 py-5 flex items-center justify-between"
                    style={{ borderBottom: "1px solid rgba(61,74,62,0.25)", background: "#2a3d2e" }}
                >
                    <div>
                        <p style={{ fontSize: "0.55rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "#587560" }}>
                            Portfolio
                        </p>
                        <h2
                            className="font-light mt-1"
                            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", color: "#ede8dd", letterSpacing: "0.04em" }}
                        >
                            {isEditing ? "Edit" : "Add"} <span style={{ fontStyle: "italic", color: "#9aab97" }}>Transaction</span>
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        style={{ background: "none", border: "none", color: "#6b7c6a", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1, padding: "4px" }}
                    >
                        x
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-7 space-y-6">
                    <div style={{ position: "relative", zIndex: 10 }}>
                        <label style={labelStyle}>Coin</label>
                        <input
                            type="text"
                            value={coinInput}
                            disabled={isEditing}
                            onChange={(e) => {
                                setCoinInput(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => {
                                if (coinInput.length >= 2 && !isEditing) setShowDropdown(true);
                            }}
                            onBlur={() => {
                                setTimeout(() => setShowDropdown(false), 150);
                            }}
                            autoComplete="off"
                            style={{ ...inputStyle, opacity: isEditing ? 0.8 : 1 }}
                        />

                        {showDropdown && coins && coins.length > 0 && (
                            <ul
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    background: "#1a1c1a",
                                    border: "1px solid rgba(61,74,62,0.35)",
                                    borderTop: "none",
                                    maxHeight: "180px",
                                    overflowY: "auto",
                                    zIndex: 20,
                                    margin: 0,
                                    padding: 0,
                                    listStyle: "none",
                                }}
                            >
                                {coins.map((coin) => (
                                    <li
                                        key={coin.id}
                                        onMouseDown={() => handleCoinSelect(coin)}
                                        style={{
                                            padding: "10px 14px",
                                            borderBottom: "1px solid rgba(61,74,62,0.15)",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <span style={{ fontSize: "0.72rem", color: "#d4cfc4", letterSpacing: "0.04em" }}>{coin.name}</span>
                                        <span style={{ fontSize: "0.55rem", letterSpacing: "0.2em", color: "#6b7c6a" }}>{coin.symbol.toUpperCase()}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label style={labelStyle}>Type</label>
                            <div className="flex gap-4">
                                {(["BUY", "SELL"] as TransactionType[]).map((type) => (
                                    <label key={type} className="flex items-center gap-2" style={{ cursor: "pointer" }}>
                                        <input
                                            type="radio"
                                            name="type"
                                            value={type}
                                            checked={formData.type === type}
                                            onChange={() => setFormData((prev) => ({ ...prev, type }))}
                                            style={{ accentColor: type === "BUY" ? "#587560" : "#8b5e3c" }}
                                        />
                                        <span style={{ fontSize: "0.72rem", color: formData.type === type ? (type === "BUY" ? "#587560" : "#8b5e3c") : "#6b7c6a", fontFamily: "'DM Mono', monospace" }}>
                                            {type}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Date</label>
                            <input
                                type="datetime-local"
                                value={formData.timestamp}
                                onChange={(e) => setFormData((prev) => ({ ...prev, timestamp: e.target.value }))}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                            <label style={labelStyle}>Quantity</label>
                            <input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                                placeholder="0.00"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Price / USD</label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                                placeholder="0.00"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Fee / USD</label>
                            <input
                                type="number"
                                value={formData.fee}
                                onChange={(e) => setFormData((prev) => ({ ...prev, fee: e.target.value }))}
                                placeholder="0.00"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {errorMessage && (
                        <div style={{ color: "#8b5e3c", fontSize: "0.65rem", letterSpacing: "0.05em", marginTop: "10px" }}>
                            {errorMessage}
                        </div>
                    )}

                    <div className="flex justify-end gap-3" style={{ borderTop: "1px solid rgba(61,74,62,0.2)", paddingTop: "20px" }}>
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
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                background: "transparent",
                                border: "1px solid rgba(196,136,90,0.4)",
                                color: "#c4885a",
                                fontFamily: "'DM Mono', monospace",
                                fontSize: "0.58rem",
                                letterSpacing: "0.25em",
                                textTransform: "uppercase",
                                padding: "9px 22px",
                                cursor: isLoading ? "not-allowed" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Transaction"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddHoldingModal;
