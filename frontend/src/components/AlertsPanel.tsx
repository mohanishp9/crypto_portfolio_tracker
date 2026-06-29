import {
    useDeleteAlertMutation,
    useGetAlertsQuery,
    useUpdateAlertMutation,
} from "../services/portfolioApi";
import { AlertSkeleton } from "./common/Skeleton";
import { Bell, BellOff, Trash2, TrendingUp, TrendingDown, Target } from "lucide-react";

const AlertsPanel = () => {
    const { data, isLoading } = useGetAlertsQuery();
    const [deleteAlert] = useDeleteAlertMutation();
    const [updateAlert] = useUpdateAlertMutation();

    return (
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm">
            <p className="text-[10px] tracking-widest uppercase text-zinc-500">
                Alerts
            </p>
            <h3 className="font-semibold text-lg text-zinc-50 tracking-tight mt-2 flex items-center gap-2">
                Price Targets
            </h3>
            <div className="space-y-3 mt-6">
                {isLoading ? (
                    <>
                        <AlertSkeleton />
                        <AlertSkeleton />
                    </>
                ) : (
                    <>
                        {(data?.alerts ?? []).map((alert) => (
                            <div key={alert._id} className="flex items-center justify-between gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-zinc-50">{alert.coinName}</span>
                                        {alert.isTriggered && (
                                            <span className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                                Triggered
                                            </span>
                                        )}
                                        {!alert.isActive && !alert.isTriggered && (
                                            <span className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest font-semibold bg-zinc-800 text-zinc-500 border border-zinc-700">
                                                Paused
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs font-mono mt-1.5 flex items-center gap-1.5 flex-wrap">
                                        <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm ${alert.direction === "ABOVE" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                                            {alert.direction === "ABOVE" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                            {alert.direction}
                                        </span>
                                        <span className="text-zinc-300 font-medium">
                                            ${alert.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                        </span>
                                        <span className="text-zinc-600">|</span>
                                        <span className="text-zinc-500">
                                            now ${alert.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0 border-l border-zinc-800 pl-3">
                                    <button
                                        type="button"
                                        className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${alert.isActive ? "text-indigo-400 hover:bg-zinc-800" : "text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800"}`}
                                        onClick={() => updateAlert({ id: alert._id, patch: { isActive: !alert.isActive } })}
                                        title={alert.isActive ? "Pause Alert" : "Resume Alert"}
                                    >
                                        {alert.isActive ? <Bell size={14} /> : <BellOff size={14} />}
                                    </button>
                                    <button
                                        type="button"
                                        className="p-1.5 rounded-md text-zinc-500 hover:text-rose-500 hover:bg-zinc-800 transition-colors flex items-center justify-center"
                                        onClick={() => deleteAlert(alert._id)}
                                        title="Delete Alert"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(data?.alerts.length ?? 0) === 0 && (
                            <div className="text-sm text-zinc-500 text-center py-6 px-4 border border-dashed border-zinc-800 rounded-lg flex flex-col items-center gap-2">
                                <Target size={20} className="text-zinc-700" />
                                <p>Set price alerts from your watchlist.<br/>They will be checked on each refresh.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AlertsPanel;
