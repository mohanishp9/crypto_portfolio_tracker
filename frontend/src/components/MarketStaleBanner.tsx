import { RefreshCw } from "lucide-react";

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
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <p className="text-[10px] tracking-widest uppercase text-amber-500 font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Market Freshness
                </p>
                <p className="text-sm text-amber-200/80 mt-1.5">
                    {staleReason || "Market data is current."}
                    {lastUpdated ? ` Last sync ${new Date(lastUpdated).toLocaleString()}.` : ""}
                </p>
            </div>
            <button
                type="button"
                onClick={onRefresh}
                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors"
            >
                <RefreshCw size={14} /> Refresh now
            </button>
        </div>
    );
};

export default MarketStaleBanner;
