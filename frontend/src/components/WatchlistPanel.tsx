import { memo, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import { useLivePrices } from "../context/LivePriceContext";
import {
    useAddAlertMutation,
    useAddToWatchlistMutation,
    useDeleteFromWatchlistMutation,
    useGetWatchlistQuery,
    useSearchCoinsQuery,
} from "../services/portfolioApi";
import { WatchlistSkeleton } from "./common/Skeleton";

// ─── Isolated alert form ────────────────────────────────────────────────────
// Kept as a separate memo'd component so it NEVER re-renders when live prices
// update in the parent. Its own state (direction, targetPrice) is fully local.

interface AlertInlineFormProps {
    coinName: string;
    coinId: string;
    coinSymbol: string;
    initialPrice: number;
    onSubmit: (direction: "ABOVE" | "BELOW", targetPrice: number) => Promise<void>;
    onCancel: () => void;
}

const AlertInlineForm = memo(({ coinName, initialPrice, onSubmit, onCancel }: AlertInlineFormProps) => {
    const [direction, setDirection] = useState<"ABOVE" | "BELOW">("ABOVE");
    const [targetPrice, setTargetPrice] = useState(initialPrice.toFixed(2));
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        const price = parseFloat(targetPrice);
        if (isNaN(price) || price <= 0) return;
        setSaving(true);
        await onSubmit(direction, price);
        // onSubmit closes the form; no need to setSaving(false) after unmount
    };

    return (
        <div
            style={{
                background: "#1a1d1a",
                border: "1px solid rgba(196,136,90,0.25)",
                borderTop: "none",
                padding: "14px 16px",
            }}
        >
            <p style={{ fontSize: "0.5rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#c4885a", marginBottom: "12px" }}>
                Set Price Alert — {coinName}
            </p>

            {/* Direction toggle */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                {(["ABOVE", "BELOW"] as const).map((dir) => (
                    <button
                        key={dir}
                        type="button"
                        onClick={() => setDirection(dir)}
                        style={{
                            flex: 1,
                            padding: "8px",
                            fontSize: "0.5rem",
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            fontFamily: "'DM Mono', monospace",
                            cursor: "pointer",
                            background: direction === dir ? "rgba(196,136,90,0.15)" : "transparent",
                            border: direction === dir
                                ? "1px solid rgba(196,136,90,0.5)"
                                : "1px solid rgba(107,124,106,0.25)",
                            color: direction === dir ? "#c4885a" : "#6b7c6a",
                            transition: "all 0.15s ease",
                        }}
                    >
                        {dir === "ABOVE" ? "▲ Above" : "▼ Below"}
                    </button>
                ))}
            </div>

            {/* Target price input */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1 }}>
                    <span style={{
                        position: "absolute",
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#6b7c6a",
                        fontSize: "0.65rem",
                        fontFamily: "'DM Mono', monospace",
                        pointerEvents: "none",
                    }}>$</span>
                    <input
                        type="text"
                        inputMode="decimal"
                        autoFocus
                        value={targetPrice}
                        onChange={(e) => {
                            const val = e.target.value;
                            // Allow only digits and a single decimal point
                            if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                setTargetPrice(val);
                            }
                        }}
                        style={{
                            width: "100%",
                            background: "#1a1c1a",
                            border: "1px solid rgba(61,74,62,0.4)",
                            color: "#ede8dd",
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "0.68rem",
                            padding: "11px 14px 11px 22px",
                            outline: "none",
                        }}
                    />
                </div>
                <button
                    type="button"
                    disabled={saving || !targetPrice || parseFloat(targetPrice) <= 0}
                    onClick={handleSubmit}
                    style={{
                        ...smallButtonStyle,
                        padding: "10px 14px",
                        color: "#c4885a",
                        borderColor: "rgba(196,136,90,0.4)",
                        opacity: saving ? 0.5 : 1,
                        cursor: saving ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                    }}
                >
                    {saving ? "Saving..." : "Set Alert"}
                </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                <p style={{ color: "#4a5a48", fontSize: "0.5rem" }}>
                    Current price: ${initialPrice.toFixed(2)}
                </p>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{ ...smallButtonStyle, fontSize: "0.45rem", padding: "4px 8px", color: "#6b7c6a" }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
});

// ─── Main panel ──────────────────────────────────────────────────────────────

const WatchlistPanel = ({ onSelectCoin }: { onSelectCoin: (coinId: string) => void }) => {
    const { data, isLoading } = useGetWatchlistQuery();
    const { livePrices } = useLivePrices();
    const [addToWatchlist] = useAddToWatchlistMutation();
    const [deleteFromWatchlist] = useDeleteFromWatchlistMutation();
    const [addAlert] = useAddAlertMutation();
    const [coinInput, setCoinInput] = useState("");
    const [selectedCoin, setSelectedCoin] = useState<{ coinId: string; coinName: string; coinSymbol: string } | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    // Only tracks WHICH coin has the form open — not the form's field values
    const [alertOpenCoinId, setAlertOpenCoinId] = useState<string | null>(null);

    const debouncedCoin = useDebounce(coinInput);
    const { data: searchResults } = useSearchCoinsQuery(debouncedCoin, {
        skip: debouncedCoin.trim().length < 2,
    });

    const handleAdd = async () => {
        if (!selectedCoin) return;
        await addToWatchlist(selectedCoin).unwrap();
        setSelectedCoin(null);
        setCoinInput("");
        setShowDropdown(false);
    };

    const handleAlertSubmit = async (
        item: { coinId: string; coinName: string; coinSymbol: string },
        direction: "ABOVE" | "BELOW",
        targetPrice: number
    ) => {
        await addAlert({
            coinId: item.coinId,
            coinName: item.coinName,
            coinSymbol: item.coinSymbol,
            direction,
            targetPrice,
        });
        setAlertOpenCoinId(null);
    };

    return (
        <div className="p-6" style={{ background: "#2e3330", border: "1px solid rgba(61,74,62,0.3)" }}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b7c6a" }}>
                        Watchlist
                    </p>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", color: "#ede8dd", marginTop: "12px" }}>
                        Track Before You Buy
                    </h3>
                </div>
                <p style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: "#9aab97" }}>
                    {data?.items.length ?? 0} coins
                </p>
            </div>

            <div style={{ position: "relative", marginTop: "20px" }}>
                <input
                    value={coinInput}
                    onChange={(e) => {
                        setCoinInput(e.target.value);
                        setSelectedCoin(null);
                        setShowDropdown(true);
                    }}
                    onFocus={() => {
                        if (coinInput.trim().length >= 2) setShowDropdown(true);
                    }}
                    onBlur={() => {
                        setTimeout(() => setShowDropdown(false), 150);
                    }}
                    placeholder="Search by coin name"
                    style={inputStyle}
                />

                {showDropdown && (searchResults?.length ?? 0) > 0 && (
                    <ul
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            background: "#1a1c1a",
                            border: "1px solid rgba(61,74,62,0.35)",
                            borderTop: "none",
                            maxHeight: "220px",
                            overflowY: "auto",
                            zIndex: 20,
                            margin: 0,
                            padding: 0,
                            listStyle: "none",
                        }}
                    >
                        {searchResults?.map((coin) => (
                            <li
                                key={coin.id}
                                onMouseDown={() => {
                                    setSelectedCoin({ coinId: coin.id, coinName: coin.name, coinSymbol: coin.symbol });
                                    setCoinInput(coin.name);
                                    setShowDropdown(false);
                                }}
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

            <button
                type="button"
                onClick={handleAdd}
                disabled={!selectedCoin}
                style={{ ...buttonStyle, opacity: selectedCoin ? 1 : 0.6, cursor: selectedCoin ? "pointer" : "not-allowed" }}
            >
                Add watchlist coin
            </button>

            <p style={{ color: "#6b7c6a", fontSize: "0.68rem", marginTop: "10px", lineHeight: 1.7 }}>
                Search by coin name only. The app fills in the CoinGecko id and symbol automatically.
            </p>

            <div className="space-y-3 mt-6">
                {isLoading ? (
                    <>
                        <WatchlistSkeleton />
                        <WatchlistSkeleton />
                    </>
                ) : (
                    <>
                        {(data?.items ?? []).map((item) => {
                            const liveData = livePrices[item.coinId];
                            const currentPrice = liveData ? liveData.price : item.currentPrice;
                            const priceChange24h = liveData ? liveData.priceChange24h : item.priceChange24h;
                            const isAlertOpen = alertOpenCoinId === item.coinId;

                            return (
                                // Key is stable (item._id only) — no updateKey, so the row
                                // never unmounts/remounts due to price ticks
                                <div key={item._id}>
                                    <div
                                        className={`flex items-center justify-between gap-4 p-3 ${liveData?.direction === "up" ? "flash-up" : liveData?.direction === "down" ? "flash-down" : ""}`}
                                        style={{ background: "#1f2320", border: "1px solid rgba(61,74,62,0.25)" }}
                                    >
                                        <button type="button" onClick={() => onSelectCoin(item.coinId)} style={{ background: "transparent", border: "none", textAlign: "left", cursor: "pointer", flex: 1 }}>
                                            <div style={{ color: "#ede8dd", fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>{item.coinName}</div>
                                            <div style={{ color: "#6b7c6a", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>{item.coinSymbol}</div>
                                        </button>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ color: "#d4cfc4", fontSize: "0.75rem" }}>${currentPrice.toFixed(2)}</div>
                                            <div style={{ color: priceChange24h >= 0 ? "#587560" : "#8b5e3c", fontSize: "0.58rem" }}>
                                                {priceChange24h >= 0 ? "+" : ""}{priceChange24h.toFixed(2)}%
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                type="button"
                                                style={{
                                                    ...smallButtonStyle,
                                                    ...(isAlertOpen ? { color: "#c4885a", borderColor: "rgba(196,136,90,0.4)" } : {}),
                                                }}
                                                onClick={() => setAlertOpenCoinId(isAlertOpen ? null : item.coinId)}
                                            >
                                                {isAlertOpen ? "✕" : "Alert"}
                                            </button>
                                            <button
                                                type="button"
                                                style={{ ...smallButtonStyle, color: "#8b5e3c", borderColor: "rgba(139,94,60,0.25)" }}
                                                onClick={() => deleteFromWatchlist(item.coinId)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>

                                    {/* AlertInlineForm is memo'd — only mounts/unmounts, never re-renders from price ticks */}
                                    {isAlertOpen && (
                                        <AlertInlineForm
                                            coinId={item.coinId}
                                            coinName={item.coinName}
                                            coinSymbol={item.coinSymbol}
                                            initialPrice={currentPrice}
                                            onSubmit={(direction, targetPrice) =>
                                                handleAlertSubmit(item, direction, targetPrice)
                                            }
                                            onCancel={() => setAlertOpenCoinId(null)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                        {(data?.items.length ?? 0) === 0 && (
                            <p style={{ color: "#6b7c6a", fontSize: "0.75rem", lineHeight: 1.8 }}>
                                Search by coin name and add a few coins here to make the dashboard feel alive even before they become holdings.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#1a1c1a",
    border: "1px solid rgba(61,74,62,0.4)",
    color: "#ede8dd",
    fontFamily: "'DM Mono', monospace",
    fontSize: "0.7rem",
    padding: "11px 14px",
    outline: "none",
};

const buttonStyle: React.CSSProperties = {
    marginTop: "12px",
    background: "transparent",
    border: "1px solid rgba(196,136,90,0.35)",
    color: "#c4885a",
    padding: "10px 14px",
    fontSize: "0.58rem",
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    fontFamily: "'DM Mono', monospace",
};

const smallButtonStyle: React.CSSProperties = {
    background: "transparent",
    border: "1px solid rgba(107,124,106,0.25)",
    color: "#9aab97",
    padding: "8px 10px",
    fontSize: "0.5rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontFamily: "'DM Mono', monospace",
    cursor: "pointer",
};

export default WatchlistPanel;
