import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../app/store";
import useDebounce from "../hooks/useDebounce";
import { useState } from "react";
import { useSearchCoinsQuery, useAddTransactionMutation } from "../services/portfolioApi";
import { closeAddModal } from "../features/portfolio/portfolioSlice";
import type { TransactionType } from "../types/portfolio.types";

const AddHoldingModal = () => {
    const dispatch = useDispatch();
    const isOpen = useSelector((state: RootState) => state.portfolio.isAddModalOpen);
    const [addTransaction, { isLoading }] = useAddTransactionMutation();
    const [coinInput, setCoinInput] = useState<string>("");
    const [showDropdown, setShowDropdown] = useState(false); // controls visibility
    const debouncedCoin = useDebounce(coinInput);
    const { data: coins } = useSearchCoinsQuery(debouncedCoin, {
        skip: debouncedCoin.length < 2,
    });
    const [formData, setFormData] = useState({
        coinId: "", coinName: "", coinSymbol: "",
        quantity: "", price: "", type: "BUY" as TransactionType
    });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleCoinSelect = (coin: any) => {
        setFormData((prev) => ({
            ...prev,
            coinId: coin.id,
            coinName: coin.name,
            coinSymbol: coin.symbol,
        }));
        setCoinInput(coin.name);
        setShowDropdown(false); // close on select
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        const quantity = Number(formData.quantity);
        const price = Number(formData.price);
        if (!formData.coinId || quantity <= 0 || price <= 0) return;
        try {
            await addTransaction({ ...formData, quantity, price }).unwrap();
            setFormData({ coinId: "", coinName: "", coinSymbol: "", quantity: "", price: "", type: "BUY" });
            setCoinInput("");
            setShowDropdown(false);
            dispatch(closeAddModal());
        } catch (err: any) {
            console.error("Failed to add transaction:", err);
            setErrorMessage(err?.data?.message || err?.error || "Failed to save transaction.");
        }
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
            <div className="w-full max-w-md" style={{ background: "#2e3330", border: "1px solid rgba(61,74,62,0.35)" }}>

                {/* Header */}
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
                            Add <span style={{ fontStyle: "italic", color: "#9aab97" }}>Holding</span>
                        </h2>
                    </div>
                    <button
                        onClick={() => dispatch(closeAddModal())}
                        style={{ background: "none", border: "none", color: "#6b7c6a", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1, padding: "4px" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#ede8dd"}
                        onMouseLeave={e => e.currentTarget.style.color = "#6b7c6a"}
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-8 py-7 space-y-6">

                    {/* Coin search — dropdown is position:absolute, won't push fields down */}
                    <div style={{ position: "relative", zIndex: 10 }}>
                        <label style={labelStyle}>Coin</label>
                        <input
                            id="coin"
                            type="text"
                            value={coinInput}
                            onChange={(e) => {
                                setCoinInput(e.target.value);
                                setShowDropdown(true); // ← reopen on new typing
                            }}
                            onFocus={e => {
                                e.currentTarget.style.borderColor = "rgba(196,136,90,0.5)";
                                if (coinInput.length >= 2) setShowDropdown(true);
                            }}
                            onBlur={e => {
                                e.currentTarget.style.borderColor = "rgba(61,74,62,0.4)";
                                // slight delay so click on dropdown item registers first
                                setTimeout(() => setShowDropdown(false), 150);
                            }}
                            autoComplete="off"
                            style={inputStyle}
                        />

                        {/* Dropdown — absolutely positioned so it floats over other fields */}
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
                                    zIndex: 20, // ← floats above quantity & buyPrice fields
                                    margin: 0,
                                    padding: 0,
                                    listStyle: "none",
                                }}
                            >
                                {coins.map((coin) => (
                                    <li
                                        key={coin.id}
                                        onMouseDown={() => handleCoinSelect(coin)} // ← onMouseDown fires before onBlur
                                        style={{
                                            padding: "10px 14px",
                                            borderBottom: "1px solid rgba(61,74,62,0.15)",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "#2a3d2e")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                    >
                                        <span style={{ fontSize: "0.72rem", color: "#d4cfc4", letterSpacing: "0.04em" }}>
                                            {coin.name}
                                        </span>
                                        <span style={{ fontSize: "0.55rem", letterSpacing: "0.2em", color: "#6b7c6a" }}>
                                            {coin.symbol.toUpperCase()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Transaction Type */}
                    <div>
                        <label style={labelStyle}>Type</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="BUY"
                                    checked={formData.type === "BUY"}
                                    onChange={() => setFormData(prev => ({ ...prev, type: "BUY" }))}
                                    style={{ accentColor: "#587560" }}
                                />
                                <span style={{ fontSize: "0.72rem", color: formData.type === "BUY" ? "#587560" : "#6b7c6a", fontFamily: "'DM Mono', monospace" }}>BUY</span>
                            </label>
                            <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="SELL"
                                    checked={formData.type === "SELL"}
                                    onChange={() => setFormData(prev => ({ ...prev, type: "SELL" }))}
                                    style={{ accentColor: "#8b5e3c" }}
                                />
                                <span style={{ fontSize: "0.72rem", color: formData.type === "SELL" ? "#8b5e3c" : "#6b7c6a", fontFamily: "'DM Mono', monospace" }}>SELL</span>
                            </label>
                        </div>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label htmlFor="quantity" style={labelStyle}>Quantity</label>
                        <input
                            id="quantity"
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                            placeholder="0.00"
                            style={inputStyle}
                            onFocus={e => e.currentTarget.style.borderColor = "rgba(196,136,90,0.5)"}
                            onBlur={e => e.currentTarget.style.borderColor = "rgba(61,74,62,0.4)"}
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label style={labelStyle}>Price <span style={{ color: "#3d4a3e" }}>/ USD</span></label>
                        <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                            placeholder="0.00"
                            style={inputStyle}
                            onFocus={e => e.currentTarget.style.borderColor = "rgba(196,136,90,0.5)"}
                            onBlur={e => e.currentTarget.style.borderColor = "rgba(61,74,62,0.4)"}
                        />
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                        <div style={{ color: "#8b5e3c", fontSize: "0.65rem", letterSpacing: "0.05em", marginTop: "10px" }}>
                            {errorMessage}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3" style={{ borderTop: "1px solid rgba(61,74,62,0.2)", paddingTop: "20px" }}>
                        <button
                            type="button"
                            onClick={() => dispatch(closeAddModal())}
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
                                transition: "all 0.25s",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                            onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.background = "#c4885a"; e.currentTarget.style.color = "#1a1c1a"; } }}
                            onMouseLeave={e => { if (!isLoading) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#c4885a"; } }}
                        >
                            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.9rem", fontWeight: 300 }}>+</span>
                            {isLoading ? "Adding..." : "Add Holding"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default AddHoldingModal;