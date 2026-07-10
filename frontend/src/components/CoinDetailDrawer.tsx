import { useGetCoinDetailQuery, useGetCoinChartQuery } from "../services/portfolioApi";
import { X, ExternalLink } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const CoinDetailDrawer = ({
    coinId,
    onClose,
}: {
    coinId: string | null;
    onClose: () => void;
}) => {
    const { data, isLoading } = useGetCoinDetailQuery(coinId ?? "", { skip: !coinId });
    const { data: chartData, isLoading: chartLoading } = useGetCoinChartQuery({ coinId: coinId ?? "", days: 7 }, { skip: !coinId });

    if (!coinId) return null;

    const formatAxisDate = (ts: number) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formatTooltipDate = (ts: number) => new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const fmtPrice = (n: number) => n >= 1 ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-surface-primary/80 ">
            <div className="w-full max-w-md h-full overflow-y-auto bg-surface-primary border-l border-border-primary shadow-2xl flex flex-col animate-slide-in">
                <div className="p-6 bg-surface-secondary border-b border-border-primary flex justify-between items-start shrink-0">
                    <div>
                        <p className="text-xs font-medium text-text-tertiary">
                            Coin detail
                        </p>
                        <h3 className="font-semibold text-2xl text-text-primary tracking-tight mt-1">
                            {data?.coin.name ?? coinId}
                        </h3>
                    </div>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary rounded-sm transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {isLoading && (
                    <div className="p-8 text-sm text-text-tertiary animate-pulse">
                        Loading coin details...
                    </div>
                )}

                {data?.coin && (
                    <div className="p-6 space-y-6">
                        <div className="flex items-center gap-5 p-5 bg-surface-secondary rounded-sm border border-border-primary">
                            {data.coin.image && (
                                <img src={data.coin.image} alt={data.coin.name} className="w-12 h-12 rounded-full" />
                            )}
                            <div>
                                <div className="text-2xl font-semibold text-text-primary font-mono tracking-tight">
                                    ${data.coin.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                </div>
                                <div className={`text-sm font-mono mt-1 ${data.coin.priceChange24h >= 0 ? "text-positive" : "text-negative"}`}>
                                    {data.coin.priceChange24h >= 0 ? "+" : ""}
                                    {data.coin.priceChange24h.toFixed(2)}% 24H
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <InfoBlock label="Market rank" value={data.coin.marketCapRank ? `#${data.coin.marketCapRank}` : "N/A"} />
                            <InfoBlock label="Market cap" value={data.coin.marketCap ? `$${Math.round(data.coin.marketCap).toLocaleString()}` : "N/A"} />
                            <InfoBlock label="24H high" value={data.coin.high24h ? `$${data.coin.high24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}` : "N/A"} />
                            <InfoBlock label="24H low" value={data.coin.low24h ? `$${data.coin.low24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}` : "N/A"} />
                        </div>

                        {/* Chart Section */}
                        <div className="p-4 bg-surface-secondary border border-border-primary rounded-sm">
                            <div className="text-xs  text-text-tertiary  mb-4">7-Day Price History</div>
                            <div className="h-48 overflow-x-auto custom-scrollbar">
                                {chartLoading ? (
                                    <div className="h-full flex items-center justify-center text-sm text-text-tertiary animate-pulse">Loading chart...</div>
                                ) : chartData?.prices?.length ? (
                                    <div className="min-w-[400px] h-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData.prices} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="drawerColorPrice" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="timestamp" tickFormatter={formatAxisDate} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} minTickGap={30} />
                                                <YAxis tickFormatter={(val) => `$${val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val}`} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                                                <Tooltip 
                                                    contentStyle={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-primary)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}
                                                    labelFormatter={(l) => formatTooltipDate(l as number)}
                                                    itemStyle={{ color: 'var(--color-text-primary)' }}
                                                    formatter={(val: number) => [fmtPrice(val), 'Price']}
                                                />
                                                <Area type="monotone" dataKey="price" stroke="#4f46e5" fillOpacity={1} fill="url(#drawerColorPrice)" strokeWidth={2} isAnimationActive={true} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-sm text-text-tertiary">No chart data available</div>
                                )}
                            </div>
                        </div>

                        {data.coin.description && (
                            <div className="pt-4 border-t border-border-primary/50">
                                <p className="text-text-tertiary text-sm leading-relaxed text-justify">
                                    {data.coin.description}
                                </p>
                            </div>
                        )}

                        {data.coin.homepage && (
                            <a 
                                href={data.coin.homepage} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-2 text-accent hover:text-accent text-sm font-medium transition-colors"
                            >
                                <ExternalLink size={16} /> Visit Homepage
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const InfoBlock = ({ label, value }: { label: string; value: string }) => (
    <div className="p-4 bg-surface-secondary border border-border-primary rounded-sm">
        <div className="text-xs  text-text-tertiary ">{label}</div>
        <div className="text-base text-text-primary mt-1 font-mono">{value}</div>
    </div>
);

export default CoinDetailDrawer;
