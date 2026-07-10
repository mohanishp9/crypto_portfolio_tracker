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
        <div className="bg-surface-secondary border border-border-primary rounded-sm flex flex-col h-[520px] overflow-hidden relative">
            <div className="px-6 py-5 border-b border-border-primary bg-surface-secondary/80 shrink-0 z-10">
                <p className="text-xs font-medium text-text-tertiary flex items-center gap-2 mb-2">
                    <Activity size={12} className="text-accent" /> Live Market
                </p>
                <h3 className="font-semibold text-lg text-text-primary tracking-tight">
                    Top <span className="font-normal text-text-tertiary italic">Coins</span>
                </h3>
                <p className="text-xs text-text-tertiary mt-2">
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
                    <p className="text-xs text-negative text-center">
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
                                className={`w-full px-6 py-3 border-b border-border-primary/50 flex items-center gap-3 cursor-pointer transition-colors duration-300 ${isActive ? 'bg-surface-tertiary/60' : 'bg-transparent'} ${liveData?.direction === "up" ? "flash-up" : liveData?.direction === "down" ? "flash-down" : ""}`}
                            >
                                <span className="text-xs text-text-tertiary w-4 shrink-0 text-right font-mono">
                                    {coin.market_cap_rank}
                                </span>
                                <img 
                                    src={coin.image} 
                                    alt={coin.name} 
                                    className={`w-6 h-6 rounded-full shrink-0 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`} 
                                />
                                <div className="flex-1 min-w-0 text-left">
                                    <div className={`text-sm  truncate transition-colors duration-300 font-medium ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
                                        {coin.name}
                                    </div>
                                    <div className="text-xs text-text-tertiary mt-0.5  font-mono">
                                        {coin.symbol.toUpperCase()}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className={`font-mono text-sm transition-colors duration-300 ${isActive ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                                        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                    </div>
                                    <div className={`font-mono text-xs mt-0.5 ${isUp ? 'text-positive' : 'text-negative'}`}>
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
