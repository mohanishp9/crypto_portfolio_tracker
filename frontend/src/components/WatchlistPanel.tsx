import { memo, useState } from "react";
import toast from "react-hot-toast";
import useDebounce from "../hooks/useDebounce";
import { useLivePrices } from "../context/LivePriceContext";
import { usePostHog } from 'posthog-js/react';
import {
    useAddAlertMutation,
    useAddToWatchlistMutation,
    useDeleteFromWatchlistMutation,
    useGetWatchlistQuery,
    useSearchCoinsQuery,
} from "../services/portfolioApi";
import { WatchlistSkeleton } from "./common/Skeleton";
import { Bell, Trash2, TrendingUp, TrendingDown, Search, Plus } from "lucide-react";

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
        
        if (direction === "ABOVE" && price <= initialPrice) {
            toast.error("Target price must be above the current price.");
            return;
        }
        if (direction === "BELOW" && price >= initialPrice) {
            toast.error("Target price must be below the current price.");
            return;
        }

        setSaving(true);
        try {
            await onSubmit(direction, price);
        } catch (err: any) {
            toast.error(err?.data?.message || err?.error || "Failed to set alert.");
            setSaving(false);
        }
    };

    return (
        <div className="bg-zinc-950/80 border border-t-0 border-indigo-500/20 px-4 py-4 rounded-b-lg">
            <p className="text-[10px] tracking-widest uppercase text-indigo-400 mb-3 font-semibold">
                Set Price Alert — {coinName}
            </p>

            {/* Direction toggle */}
            <div className="flex gap-2 mb-3">
                {(["ABOVE", "BELOW"] as const).map((dir) => (
                    <button
                        key={dir}
                        type="button"
                        onClick={() => setDirection(dir)}
                        className={`flex-1 py-2 text-[10px] tracking-widest uppercase font-mono rounded-md border transition-all duration-150 flex items-center justify-center gap-1.5 ${
                            direction === dir 
                                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-semibold" 
                                : "bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                        }`}
                    >
                        {dir === "ABOVE" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {dir}
                    </button>
                ))}
            </div>

            {/* Target price input */}
            <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm pointer-events-none">$</span>
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
                        className="w-full bg-zinc-900 border border-zinc-700 text-zinc-50 font-mono text-sm py-2 pl-7 pr-3 rounded-md focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
                <button
                    type="button"
                    disabled={saving || !targetPrice || parseFloat(targetPrice) <= 0}
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap"
                >
                    {saving ? "Saving..." : "Set Alert"}
                </button>
            </div>
            <div className="flex justify-between items-center mt-3">
                <p className="text-[10px] font-mono text-zinc-500">
                    Current: ${initialPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </p>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
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
    const posthog = usePostHog();

    // Only tracks WHICH coin has the form open — not the form's field values
    const [alertOpenCoinId, setAlertOpenCoinId] = useState<string | null>(null);

    const debouncedCoin = useDebounce(coinInput);
    const { data: searchResults } = useSearchCoinsQuery(debouncedCoin, {
        skip: debouncedCoin.trim().length < 2,
    });

    const handleAdd = async () => {
        if (!selectedCoin) return;
        await addToWatchlist(selectedCoin).unwrap();
        posthog?.capture('Added to Watchlist', { coin: selectedCoin.coinSymbol });
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
        }).unwrap();
        posthog?.capture('Created Price Alert', { coin: item.coinSymbol, direction, targetPrice });
        setAlertOpenCoinId(null);
    };

    return (
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] tracking-widest uppercase text-zinc-500">
                        Watchlist
                    </p>
                    <h3 className="font-semibold text-lg text-zinc-50 tracking-tight mt-2">
                        Track Before You Buy
                    </h3>
                </div>
                <p className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800">
                    {data?.items.length ?? 0} <span className="text-zinc-600">COINS</span>
                </p>
            </div>

            <div className="relative mt-5">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-zinc-500" />
                </div>
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
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-50 text-sm py-2.5 pl-9 pr-4 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors placeholder-zinc-600"
                />

                {showDropdown && (searchResults?.length ?? 0) > 0 && (
                    <ul className="absolute top-full left-0 right-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-lg max-h-56 overflow-y-auto z-20 shadow-xl py-1">
                        {searchResults?.map((coin) => (
                            <li
                                key={coin.id}
                                onMouseDown={() => {
                                    setSelectedCoin({ coinId: coin.id, coinName: coin.name, coinSymbol: coin.symbol });
                                    setCoinInput(coin.name);
                                    setShowDropdown(false);
                                }}
                                className="px-4 py-2.5 hover:bg-zinc-800 cursor-pointer flex items-center justify-between transition-colors"
                            >
                                <span className="text-sm text-zinc-300 font-medium">{coin.name}</span>
                                <span className="text-[10px] tracking-widest font-mono text-zinc-500 uppercase">{coin.symbol}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <button
                type="button"
                onClick={handleAdd}
                disabled={!selectedCoin}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600 disabled:bg-zinc-950
                border-indigo-500/30 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20"
            >
                <Plus size={14} /> Add to Watchlist
            </button>

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
                            const isUp = priceChange24h >= 0;

                            return (
                                // Key is stable (item._id only) — no updateKey, so the row
                                // never unmounts/remounts due to price ticks
                                <div key={item._id} className="relative">
                                    <div
                                        className={`flex items-center justify-between gap-4 p-4 rounded-lg bg-zinc-950 border transition-colors ${isAlertOpen ? 'border-indigo-500/30 rounded-b-none' : 'border-zinc-800 hover:border-zinc-700'} ${liveData?.direction === "up" ? "flash-up" : liveData?.direction === "down" ? "flash-down" : ""}`}
                                    >
                                        <button type="button" onClick={() => onSelectCoin(item.coinId)} className="flex-1 text-left focus:outline-none group">
                                            <div className="font-medium text-sm text-zinc-50 group-hover:text-white transition-colors">{item.coinName}</div>
                                            <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mt-0.5">{item.coinSymbol}</div>
                                        </button>
                                        <div className="text-right">
                                            <div className="font-mono text-sm font-medium text-zinc-300">
                                                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                            </div>
                                            <div className={`font-mono text-[10px] mt-0.5 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {isUp ? "+" : ""}{priceChange24h.toFixed(2)}%
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 shrink-0 border-l border-zinc-800 pl-3 ml-1">
                                            <button
                                                type="button"
                                                className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${isAlertOpen ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800'}`}
                                                onClick={() => setAlertOpenCoinId(isAlertOpen ? null : item.coinId)}
                                                title="Set Alert"
                                            >
                                                <Bell size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                className="p-1.5 rounded-md text-zinc-500 hover:text-rose-500 hover:bg-zinc-800 transition-colors flex items-center justify-center"
                                                onClick={() => deleteFromWatchlist(item.coinId)}
                                                title="Remove"
                                            >
                                                <Trash2 size={14} />
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
                            <p className="text-sm text-zinc-500 text-center py-4 px-2 border border-dashed border-zinc-800 rounded-lg">
                                Search and add coins to track them before buying.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default WatchlistPanel;
