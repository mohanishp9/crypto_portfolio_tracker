import { useEffect, useRef, useState } from "react";
import { useGetTopCoinsQuery } from "../services/portfolioApi";
import type { TopCoin } from "../types/coin.types";
import { useLivePrices } from "../context/LivePriceContext";
import { TopCoinSkeleton } from "./common/Skeleton";
import { Activity } from "lucide-react";

const TopCoinsList = ({ onSelectCoin }: { onSelectCoin: (coinId: string) => void }) => {
    const { data, isLoading, error } = useGetTopCoinsQuery();
    const { livePrices } = useLivePrices();
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col h-[520px] shadow-sm overflow-hidden relative">
            {/* Subtle glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/80 shrink-0 z-10">
                <p className="text-[10px] tracking-widest uppercase text-zinc-500 flex items-center gap-2 mb-2">
                    <Activity size={12} className="text-indigo-400" /> Live Market
                </p>
                <h3 className="font-semibold text-lg text-zinc-50 tracking-tight">
                    Top <span className="font-normal text-zinc-500 italic">Coins</span>
                </h3>
                <p className="text-[10px] tracking-widest text-zinc-500 mt-2 uppercase font-mono">
                    {data?.stale ? "cached market view" : "free-tier friendly refresh"}
                </p>
            </div>

            {isLoading && (
                <div className="flex-1 overflow-y-hidden p-2">
                    <TopCoinSkeleton />
                    <TopCoinSkeleton />
                    <TopCoinSkeleton />
                    <TopCoinSkeleton />
                    <TopCoinSkeleton />
                </div>
            )}

            {error && (
                <div className="flex-1 flex items-center justify-center p-6">
                    <p className="text-xs tracking-wider text-rose-500 text-center uppercase">
                        Market data unavailable
                    </p>
                </div>
            )}

            {data?.coins && (
                <div ref={listRef} className="flex-1 overflow-y-hidden scrollbar-none">
                    {[...data.coins, ...data.coins].map((coin: TopCoin, index: number) => {
                        const liveData = livePrices[coin.id];
                        const currentPrice = liveData ? liveData.price : coin.current_price;
                        const priceChange24h = liveData ? liveData.priceChange24h : coin.price_change_percentage_24h;
                        const isUp = priceChange24h >= 0;
                        const key = `${coin.id}-${index}`;
                        const isActive = activeCoin === key;

                        return (
                            <button
                                key={`${key}-${liveData?.updateKey ?? 0}`}
                                type="button"
                                onClick={() => onSelectCoin(coin.id)}
                                onMouseEnter={() => setActiveCoin(key)}
                                onMouseLeave={() => setActiveCoin(null)}
                                className={`w-full px-6 py-3 border-b border-zinc-800/50 flex items-center gap-3 cursor-pointer transition-colors duration-300 ${isActive ? 'bg-zinc-800/60' : 'bg-transparent'} ${liveData?.direction === "up" ? "flash-up" : liveData?.direction === "down" ? "flash-down" : ""}`}
                            >
                                <span className="text-[10px] tracking-wider text-zinc-500 w-4 shrink-0 text-right font-mono">
                                    {coin.market_cap_rank}
                                </span>
                                <img 
                                    src={coin.image} 
                                    alt={coin.name} 
                                    className={`w-6 h-6 rounded-full shrink-0 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`} 
                                />
                                <div className="flex-1 min-w-0 text-left">
                                    <div className={`text-sm tracking-wide truncate transition-colors duration-300 font-medium ${isActive ? 'text-zinc-50' : 'text-zinc-300'}`}>
                                        {coin.name}
                                    </div>
                                    <div className="text-[10px] tracking-widest text-zinc-500 mt-0.5 uppercase font-mono">
                                        {coin.symbol.toUpperCase()}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className={`font-mono text-sm transition-colors duration-300 ${isActive ? 'text-zinc-50 font-medium' : 'text-zinc-400'}`}>
                                        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                    </div>
                                    <div className={`font-mono text-xs mt-0.5 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {isUp ? "+" : "-"}
                                        {Math.abs(priceChange24h).toFixed(2)}%
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
