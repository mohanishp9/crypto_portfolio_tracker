const MarketStaleBanner = ({
    lastUpdated,
    staleReason,
    onRefresh,
}: {
    lastUpdated?: string | null;
    staleReason?: string;
    onRefresh: () => void;
}) => {
    if (!staleReason && !lastUpdated) return null;

    return (
        <div
            className="mt-6 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            style={{ background: "rgba(196,136,90,0.08)", border: "1px solid rgba(196,136,90,0.2)" }}
        >
            <div>
                <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#c4885a" }}>
                    Market freshness
                </p>
                <p style={{ color: "#d4cfc4", fontSize: "0.82rem", marginTop: "8px", lineHeight: 1.7 }}>
                    {staleReason || "Market data is current."}
                    {lastUpdated ? ` Last sync ${new Date(lastUpdated).toLocaleString()}.` : ""}
                </p>
            </div>
            <button
                type="button"
                onClick={onRefresh}
                style={{
                    background: "transparent",
                    border: "1px solid rgba(196,136,90,0.35)",
                    color: "#c4885a",
                    padding: "10px 16px",
                    fontSize: "0.58rem",
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    fontFamily: "'DM Mono', monospace",
                    cursor: "pointer",
                }}
            >
                Refresh now
            </button>
        </div>
    );
};

export default MarketStaleBanner;
