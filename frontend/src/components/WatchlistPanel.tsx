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
        setSaving(true);
        await onSubmit(direction, price);
        // onSubmit closes the form; no need to setSaving(false) after unmount
    };

    return (
        <div className="bg-white border-4 border-black border-t-0 px-4 py-4 brutalist-shadow-sm relative z-0">
            <p className="text-sm font-black uppercase text-black mb-3 border-b-2 border-black pb-2">
                SET PRICE ALERT — {coinName}
            </p>

            {/* Direction toggle */}
            <div className="flex gap-2 mb-3">
                {(["ABOVE", "BELOW"] as const).map((dir) => (
                    <button
                        key={dir}
                        type="button"
                        onClick={() => setDirection(dir)}
                        className={`flex-1 py-2 text-xs font-black uppercase font-mono border-2 border-black transition-all duration-150 flex items-center justify-center gap-1.5 ${
                            direction === dir 
                                ? "bg-black text-white" 
                                : "bg-white text-black hover:bg-[#ccff00]"
                        }`}
                    >
                        {dir === "ABOVE" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
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
                        className="w-full bg-white border-2 border-black text-black font-mono font-bold text-sm py-2 pl-7 pr-3 focus:outline-none focus:bg-[#ccff00] transition-colors"
                    />
                </div>
                <button
                    type="button"
                    disabled={saving || !targetPrice || parseFloat(targetPrice) <= 0}
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-black text-white border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap hover:bg-white hover:text-black"
                >
                    {saving ? "SAVING..." : "SET ALERT"}
                </button>
            </div>
            <div className="flex justify-between items-center mt-3">
                <p className="text-xs font-mono font-bold text-black bg-[#ccff00] border-2 border-black px-1 inline-block">
                    CURRENT: ${initialPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </p>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-xs font-black uppercase text-black hover:underline"
                >
                    CANCEL
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
        <div className="brutalist-card h-full">
            <div className="flex items-start justify-between gap-4 border-b-4 border-black pb-2 mb-4">
                <div>
                    <p className="text-sm font-black uppercase tracking-tighter">
                        WATCHLIST
                    </p>
                    <h3 className="font-black text-xl text-black tracking-tight mt-1">
                        TRACK BEFORE YOU BUY
                    </h3>
                </div>
                <p className="text-xs font-mono font-bold text-black bg-[#ccff00] px-2 py-1 border-2 border-black shadow-[2px_2px_0_0_#000]">
                    {data?.items.length ?? 0} COINS
                </p>
            </div>

            <div className="relative mt-5">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-black font-bold" />
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
                    placeholder="SEARCH BY COIN NAME"
                    className="w-full bg-white border-4 border-black text-black font-mono font-bold text-sm py-2.5 pl-10 pr-4 focus:outline-none focus:bg-[#ccff00] transition-colors placeholder-black uppercase brutalist-shadow-sm"
                />

                {showDropdown && (searchResults?.length ?? 0) > 0 && (
                    <ul className="absolute top-full left-0 right-0 mt-1 bg-white border-4 border-black max-h-56 overflow-y-auto z-20 brutalist-shadow py-1">
                        {searchResults?.map((coin) => (
                            <li
                                key={coin.id}
                                onMouseDown={() => {
                                    setSelectedCoin({ coinId: coin.id, coinName: coin.name, coinSymbol: coin.symbol });
                                    setCoinInput(coin.name);
                                    setShowDropdown(false);
                                }}
                                className="px-4 py-2.5 hover:bg-[#ccff00] cursor-pointer flex items-center justify-between border-b-2 border-black last:border-b-0"
                            >
                                <span className="text-sm text-black font-black uppercase">{coin.name}</span>
                                <span className="text-xs font-mono font-bold text-black bg-[#ccff00] border-2 border-black px-1 group-hover:bg-white">{coin.symbol}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <button
                type="button"
                onClick={handleAdd}
                disabled={!selectedCoin}
                className="brutalist-btn w-full mt-4 justify-center bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus size={16} strokeWidth={3} /> ADD TO WATCHLIST
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
                                <div key={item._id} className="relative z-10">
                                    <div
                                        className={`flex items-center justify-between gap-4 p-4 bg-white border-4 border-black transition-colors ${isAlertOpen ? 'border-b-0' : 'hover:bg-[#ccff00]'} ${liveData?.direction === "up" ? "flash-up" : liveData?.direction === "down" ? "flash-down" : ""}`}
                                    >
                                        <button type="button" onClick={() => onSelectCoin(item.coinId)} className="flex-1 text-left focus:outline-none group">
                                            <div className="font-black uppercase text-sm text-black">{item.coinName}</div>
                                            <div className="text-xs font-bold font-mono text-black bg-[#ccff00] border-2 border-black inline-block px-1 mt-1 group-hover:bg-white">{item.coinSymbol}</div>
                                        </button>
                                        <div className="text-right">
                                            <div className="font-mono text-sm font-black text-black">
                                                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                            </div>
                                            <div className={`font-mono font-bold text-xs mt-0.5 ${isUp ? 'text-blue-700' : 'text-red-600'}`}>
                                                {isUp ? "+" : ""}{priceChange24h.toFixed(2)}%
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 shrink-0 border-l-4 border-black pl-3 ml-1">
                                            <button
                                                type="button"
                                                className={`p-1.5 border-2 border-black transition-colors flex items-center justify-center ${isAlertOpen ? 'bg-black text-white' : 'text-black hover:bg-[#ccff00] bg-white'}`}
                                                onClick={() => setAlertOpenCoinId(isAlertOpen ? null : item.coinId)}
                                                title="Set Alert"
                                            >
                                                <Bell size={16} strokeWidth={2.5} />
                                            </button>
                                            <button
                                                type="button"
                                                className="p-1.5 border-2 border-black text-black bg-white hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                                                onClick={() => deleteFromWatchlist(item.coinId)}
                                                title="Remove"
                                            >
                                                <Trash2 size={16} strokeWidth={2.5} />
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
                            <div className="font-mono font-bold text-black border-4 border-dashed border-black p-4 text-center uppercase text-sm">
                                SEARCH AND ADD COINS TO TRACK THEM BEFORE BUYING.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default WatchlistPanel;
