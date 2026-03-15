import { useGetTopCoinsQuery } from "../services/portfolioApi";
import type { TopCoin } from "../types/coin.types";
import { useEffect, useRef, useState } from "react";

const TopCoinsList = () => {
    const { data, isLoading, error } = useGetTopCoinsQuery();
    const listRef = useRef<HTMLDivElement>(null);
    const [activeCoin, setActiveCoin] = useState<string | null>(null);

    useEffect(() => {
        const el = listRef.current;
        if (!el || !data?.coins?.length) return;

        let frame: number;
        let paused = false;
        let pos = 0;

        const scroll = () => {
            if (!paused) {
                pos += 0.5;
                // reset when we've scrolled through half — creates seamless loop
                if (pos >= el.scrollHeight / 2) pos = 0;
                el.scrollTop = pos;
            }
            frame = requestAnimationFrame(scroll);
        };

        // small delay so DOM is ready
        const t = setTimeout(() => {
            frame = requestAnimationFrame(scroll);
        }, 600);

        el.addEventListener("mouseenter", () => (paused = true));
        el.addEventListener("mouseleave", () => (paused = false));

        return () => {
            clearTimeout(t);
            cancelAnimationFrame(frame);
        };
    }, [data]);

    return (
        <div style={{
            background: "#2e3330",
            border: "1px solid rgba(61,74,62,0.35)",
            display: "flex",
            flexDirection: "column",
            height: "520px",           // ← fixed height so scroll actually works
        }}>
            <style>{`
        .coin-row { transition: background 0.3s; }
        .coin-row:hover { background: rgba(42,61,46,0.7) !important; }
        .price-tick { transition: color 0.4s, transform 0.3s; }
        @keyframes tickUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes zenPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.15); }
        }
      `}</style>

            {/* Header */}
            <div style={{
                padding: "20px 24px 18px",
                borderBottom: "1px solid rgba(61,74,62,0.25)",
                background: "#2a3d2e",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            }}>
                <div>
                    <p style={{
                        fontSize: "0.52rem", letterSpacing: "0.35em",
                        textTransform: "uppercase", color: "#587560", marginBottom: "4px",
                    }}>
                        Live Market
                    </p>
                    <h3 style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1.2rem", fontWeight: 300,
                        color: "#ede8dd", letterSpacing: "0.04em",
                    }}>
                        Top <span style={{ fontStyle: "italic", color: "#9aab97" }}>Coins</span>
                    </h3>
                </div>

                {/* Live pulse dot */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#587560",
                        animation: "zenPulse 2.5s ease-in-out infinite",
                    }} />
                    <span style={{
                        fontSize: "0.48rem", letterSpacing: "0.25em",
                        textTransform: "uppercase", color: "#3d4a3e",
                    }}>
                        live
                    </span>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        border: "1px solid rgba(196,136,90,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        animation: "zenPulse 2s ease-in-out infinite",
                    }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(196,136,90,0.5)" }} />
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                    <p style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "#8b5e3c", textAlign: "center" }}>
                        Market data<br />unavailable
                    </p>
                </div>
            )}

            {/* Scrolling list */}
            {data?.coins && (
                <div
                    ref={listRef}
                    style={{
                        flex: 1,
                        overflowY: "hidden",     // hide scrollbar, scroll via JS
                        scrollbarWidth: "none",
                    }}
                >
                    {/* Render coins TWICE for seamless loop */}
                    {[...data.coins, ...data.coins].map((coin: TopCoin, i: number) => {
                        const isUp = coin.price_change_percentage_24h >= 0;
                        const isActive = activeCoin === `${coin.id}-${i}`;

                        return (
                            <div
                                key={`${coin.id}-${i}`}
                                className="coin-row"
                                onMouseEnter={() => setActiveCoin(`${coin.id}-${i}`)}
                                onMouseLeave={() => setActiveCoin(null)}
                                style={{
                                    padding: "11px 20px",
                                    borderBottom: "1px solid rgba(61,74,62,0.12)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    animation: i < data.coins.length
                                        ? `tickUp 0.5s ease ${(i % 10) * 0.05}s both`
                                        : "none",
                                    cursor: "default",
                                }}
                            >
                                {/* Rank */}
                                <span style={{
                                    fontSize: "0.48rem", letterSpacing: "0.1em",
                                    color: isActive ? "#6b7c6a" : "#3d4a3e",
                                    width: "14px", flexShrink: 0, textAlign: "right",
                                    transition: "color 0.3s",
                                }}>
                                    {coin.market_cap_rank}
                                </span>

                                {/* Coin image */}
                                <img
                                    src={coin.image}
                                    alt={coin.name}
                                    style={{
                                        width: 20, height: 20,
                                        borderRadius: "50%",
                                        flexShrink: 0,
                                        opacity: isActive ? 1 : 0.7,
                                        transition: "opacity 0.3s",
                                    }}
                                />

                                {/* Name + symbol */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: "0.65rem",
                                        color: isActive ? "#ede8dd" : "#b8b0a4",
                                        letterSpacing: "0.03em",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        fontFamily: "'DM Mono', monospace",
                                        transition: "color 0.3s",
                                    }}>
                                        {coin.name}
                                    </div>
                                    <div style={{
                                        fontSize: "0.48rem", letterSpacing: "0.18em",
                                        color: "#6b7c6a", marginTop: "1px",
                                    }}>
                                        {coin.symbol.toUpperCase()}
                                    </div>
                                </div>

                                {/* Price + change */}
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <div
                                        className="price-tick"
                                        style={{
                                            fontFamily: "'DM Mono', monospace",
                                            fontSize: "0.63rem",
                                            color: isActive ? "#ede8dd" : "#d4cfc4",
                                            letterSpacing: "0.02em",
                                        }}
                                    >
                                        ${coin.current_price.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </div>
                                    <div style={{
                                        fontSize: "0.5rem", letterSpacing: "0.08em",
                                        color: isUp ? "#587560" : "#8b5e3c",
                                        marginTop: "2px",
                                        display: "flex", alignItems: "center",
                                        justifyContent: "flex-end", gap: "3px",
                                    }}>
                                        <span style={{ fontSize: "0.42rem" }}>{isUp ? "▲" : "▼"}</span>
                                        {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TopCoinsList;