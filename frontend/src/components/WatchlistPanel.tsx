import { useState } from "react";
import useDebounce from "../hooks/useDebounce";
import {
    useAddAlertMutation,
    useAddToWatchlistMutation,
    useDeleteFromWatchlistMutation,
    useGetWatchlistQuery,
    useSearchCoinsQuery,
} from "../services/portfolioApi";

const WatchlistPanel = ({ onSelectCoin }: { onSelectCoin: (coinId: string) => void }) => {
    const { data } = useGetWatchlistQuery();
    const [addToWatchlist] = useAddToWatchlistMutation();
    const [deleteFromWatchlist] = useDeleteFromWatchlistMutation();
    const [addAlert] = useAddAlertMutation();
    const [coinInput, setCoinInput] = useState("");
    const [selectedCoin, setSelectedCoin] = useState<{ coinId: string; coinName: string; coinSymbol: string } | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

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
                        if (coinInput.trim().length >= 2) {
                            setShowDropdown(true);
                        }
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
                                    setSelectedCoin({
                                        coinId: coin.id,
                                        coinName: coin.name,
                                        coinSymbol: coin.symbol,
                                    });
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
                {(data?.items ?? []).map((item) => (
                    <div key={item._id} className="flex items-center justify-between gap-4 p-3" style={{ background: "#1f2320", border: "1px solid rgba(61,74,62,0.25)" }}>
                        <button type="button" onClick={() => onSelectCoin(item.coinId)} style={{ background: "transparent", border: "none", textAlign: "left", cursor: "pointer", flex: 1 }}>
                            <div style={{ color: "#ede8dd", fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>{item.coinName}</div>
                            <div style={{ color: "#6b7c6a", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>{item.coinSymbol}</div>
                        </button>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ color: "#d4cfc4", fontSize: "0.75rem" }}>${item.currentPrice.toFixed(2)}</div>
                            <div style={{ color: item.priceChange24h >= 0 ? "#587560" : "#8b5e3c", fontSize: "0.58rem" }}>
                                {item.priceChange24h >= 0 ? "+" : ""}
                                {item.priceChange24h.toFixed(2)}%
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                style={smallButtonStyle}
                                onClick={() =>
                                    addAlert({
                                        coinId: item.coinId,
                                        coinName: item.coinName,
                                        coinSymbol: item.coinSymbol,
                                        direction: "ABOVE",
                                        targetPrice: item.currentPrice * 1.1,
                                    })
                                }
                            >
                                Alert
                            </button>
                            <button type="button" style={{ ...smallButtonStyle, color: "#8b5e3c", borderColor: "rgba(139,94,60,0.25)" }} onClick={() => deleteFromWatchlist(item.coinId)}>
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
                {(data?.items.length ?? 0) === 0 && (
                    <p style={{ color: "#6b7c6a", fontSize: "0.75rem", lineHeight: 1.8 }}>
                        Search by coin name and add a few coins here to make the dashboard feel alive even before they become holdings.
                    </p>
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
