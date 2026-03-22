import { useGetCoinDetailQuery } from "../services/portfolioApi";

const CoinDetailDrawer = ({
    coinId,
    onClose,
}: {
    coinId: string | null;
    onClose: () => void;
}) => {
    const { data, isLoading } = useGetCoinDetailQuery(coinId ?? "", { skip: !coinId });

    if (!coinId) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(26,28,26,0.75)" }}>
            <div className="w-full max-w-md h-full overflow-y-auto" style={{ background: "#2e3330", borderLeft: "1px solid rgba(61,74,62,0.3)" }}>
                <div className="p-6 flex justify-between items-start" style={{ background: "#2a3d2e", borderBottom: "1px solid rgba(61,74,62,0.25)" }}>
                    <div>
                        <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b7c6a" }}>
                            Coin detail
                        </p>
                        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", color: "#ede8dd", marginTop: "12px" }}>
                            {data?.coin.name ?? coinId}
                        </h3>
                    </div>
                    <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", color: "#9aab97", fontSize: "1.2rem", cursor: "pointer" }}>
                        x
                    </button>
                </div>

                {isLoading && <div style={{ padding: "24px", color: "#9aab97" }}>Loading coin details...</div>}

                {data?.coin && (
                    <div className="p-6 space-y-5">
                        <div className="flex items-center gap-4">
                            {data.coin.image && <img src={data.coin.image} alt={data.coin.name} style={{ width: 44, height: 44, borderRadius: "50%" }} />}
                            <div>
                                <div style={{ color: "#ede8dd", fontSize: "1rem" }}>${data.coin.currentPrice.toFixed(2)}</div>
                                <div style={{ color: data.coin.priceChange24h >= 0 ? "#587560" : "#8b5e3c", fontSize: "0.65rem" }}>
                                    {data.coin.priceChange24h >= 0 ? "+" : ""}
                                    {data.coin.priceChange24h.toFixed(2)}% 24H
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <InfoBlock label="Market rank" value={data.coin.marketCapRank ? `#${data.coin.marketCapRank}` : "N/A"} />
                            <InfoBlock label="Market cap" value={data.coin.marketCap ? `$${Math.round(data.coin.marketCap).toLocaleString()}` : "N/A"} />
                            <InfoBlock label="24H high" value={data.coin.high24h ? `$${data.coin.high24h.toFixed(2)}` : "N/A"} />
                            <InfoBlock label="24H low" value={data.coin.low24h ? `$${data.coin.low24h.toFixed(2)}` : "N/A"} />
                        </div>

                        {data.coin.description && (
                            <p style={{ color: "#d4cfc4", lineHeight: 1.8, fontSize: "0.8rem" }}>{data.coin.description}</p>
                        )}

                        {data.coin.homepage && (
                            <a href={data.coin.homepage} target="_blank" rel="noreferrer" style={{ color: "#c4885a", fontSize: "0.72rem" }}>
                                Visit homepage
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const InfoBlock = ({ label, value }: { label: string; value: string }) => (
    <div className="p-3" style={{ background: "#1f2320", border: "1px solid rgba(61,74,62,0.25)" }}>
        <div style={{ fontSize: "0.5rem", letterSpacing: "0.2em", color: "#6b7c6a", textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: "0.9rem", color: "#ede8dd", marginTop: "8px" }}>{value}</div>
    </div>
);

export default CoinDetailDrawer;
