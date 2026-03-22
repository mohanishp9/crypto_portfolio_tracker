import { useEffect, useRef, useState } from "react";
import { useGetTopCoinsQuery } from "../services/portfolioApi";
import type { TopCoin } from "../types/coin.types";

const TopCoinsList = ({ onSelectCoin }: { onSelectCoin: (coinId: string) => void }) => {
    const { data, isLoading, error } = useGetTopCoinsQuery();
    const listRef = useRef<HTMLDivElement>(null);
    const [activeCoin, setActiveCoin] = useState<string | null>(null);

    useEffect(() => {
        const el = listRef.current;
        if (!el || !data?.coins?.length) return;

        let frame = 0;
        let paused = false;
        let pos = 0;

        const scroll = () => {
            if (!paused) {
                pos += 0.5;
                if (pos >= el.scrollHeight / 2) pos = 0;
                el.scrollTop = pos;
            }
            frame = requestAnimationFrame(scroll);
        };

        const t = window.setTimeout(() => {
            frame = requestAnimationFrame(scroll);
        }, 600);

        const onEnter = () => { paused = true; };
        const onLeave = () => { paused = false; };
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);

        return () => {
            clearTimeout(t);
            cancelAnimationFrame(frame);
            el.removeEventListener("mouseenter", onEnter);
            el.removeEventListener("mouseleave", onLeave);
        };
    }, [data]);

    return (
        <div style={{ background: "#2e3330", border: "1px solid rgba(61,74,62,0.35)", display: "flex", flexDirection: "column", height: "520px" }}>
            <div style={{ padding: "20px 24px 18px", borderBottom: "1px solid rgba(61,74,62,0.25)", background: "#2a3d2e", flexShrink: 0 }}>
                <p style={{ fontSize: "0.52rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "#587560", marginBottom: "4px" }}>
                    Live Market
                </p>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", fontWeight: 300, color: "#ede8dd", letterSpacing: "0.04em" }}>
                    Top <span style={{ fontStyle: "italic", color: "#9aab97" }}>Coins</span>
                </h3>
                <p style={{ fontSize: "0.5rem", letterSpacing: "0.18em", color: "#6b7c6a", marginTop: "10px", textTransform: "uppercase" }}>
                    {data?.stale ? "cached market view" : "free-tier friendly refresh"}
                </p>
            </div>

            {isLoading && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9aab97" }}>
                    Loading market...
                </div>
            )}

            {error && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                    <p style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "#8b5e3c", textAlign: "center" }}>
                        Market data unavailable
                    </p>
                </div>
            )}

            {data?.coins && (
                <div ref={listRef} style={{ flex: 1, overflowY: "hidden", scrollbarWidth: "none" }}>
                    {[...data.coins, ...data.coins].map((coin: TopCoin, index: number) => {
                        const isUp = coin.price_change_percentage_24h >= 0;
                        const key = `${coin.id}-${index}`;
                        const isActive = activeCoin === key;

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => onSelectCoin(coin.id)}
                                onMouseEnter={() => setActiveCoin(key)}
                                onMouseLeave={() => setActiveCoin(null)}
                                style={{
                                    width: "100%",
                                    padding: "11px 20px",
                                    borderBottom: "1px solid rgba(61,74,62,0.12)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    cursor: "pointer",
                                    background: isActive ? "rgba(42,61,46,0.7)" : "transparent",
                                    borderLeft: "none",
                                    borderRight: "none",
                                    borderTop: "none",
                                }}
                            >
                                <span style={{ fontSize: "0.48rem", letterSpacing: "0.1em", color: "#3d4a3e", width: "14px", flexShrink: 0, textAlign: "right" }}>
                                    {coin.market_cap_rank}
                                </span>
                                <img src={coin.image} alt={coin.name} style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                                    <div style={{ fontSize: "0.65rem", color: isActive ? "#ede8dd" : "#b8b0a4", letterSpacing: "0.03em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "'DM Mono', monospace" }}>
                                        {coin.name}
                                    </div>
                                    <div style={{ fontSize: "0.48rem", letterSpacing: "0.18em", color: "#6b7c6a", marginTop: "1px" }}>
                                        {coin.symbol.toUpperCase()}
                                    </div>
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.63rem", color: isActive ? "#ede8dd" : "#d4cfc4" }}>
                                        ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div style={{ fontSize: "0.5rem", letterSpacing: "0.08em", color: isUp ? "#587560" : "#8b5e3c", marginTop: "2px" }}>
                                        {isUp ? "+" : "-"}
                                        {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TopCoinsList;
