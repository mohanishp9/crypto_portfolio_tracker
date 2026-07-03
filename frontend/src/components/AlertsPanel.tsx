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
        <div className="brutalist-card h-full">
            <p className="text-sm font-black uppercase tracking-tighter mb-4 border-b-4 border-black pb-2">
                ALERTS
            </p>
            <h3 className="font-black text-xl text-black tracking-tight mt-1">
                PRICE TARGETS
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
                            <div key={alert._id} className="flex items-center justify-between gap-4 p-4 bg-white border-4 border-black hover:bg-[#ccff00] transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-sm text-black uppercase">{alert.coinName}</span>
                                        {alert.isTriggered && (
                                            <span className="px-1.5 py-0.5 text-xs uppercase font-bold bg-[#ff3333] text-white border-2 border-black">
                                                TRIGGERED
                                            </span>
                                        )}
                                        {!alert.isActive && !alert.isTriggered && (
                                            <span className="px-1.5 py-0.5 text-xs uppercase font-bold bg-black text-white border-2 border-black">
                                                PAUSED
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs font-mono font-bold mt-1.5 flex items-center gap-1.5 flex-wrap">
                                        <span className={`flex items-center gap-0.5 px-1.5 py-0.5 border-2 border-black ${alert.direction === "ABOVE" ? "bg-black text-white" : "bg-[#ff3333] text-white"}`}>
                                            {alert.direction === "ABOVE" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {alert.direction}
                                        </span>
                                        <span className="text-black font-black text-sm">
                                            ${alert.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                        </span>
                                        <span className="text-black">|</span>
                                        <span className="text-black">
                                            NOW ${alert.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0 border-l-4 border-black pl-3">
                                    <button
                                        type="button"
                                        className={`p-1.5 border-2 border-black transition-colors flex items-center justify-center ${alert.isActive ? "bg-black text-white" : "text-black hover:bg-[#ccff00] bg-white"}`}
                                        onClick={() => updateAlert({ id: alert._id, patch: { isActive: !alert.isActive } })}
                                        title={alert.isActive ? "Pause Alert" : "Resume Alert"}
                                    >
                                        {alert.isActive ? <Bell size={16} strokeWidth={2.5} /> : <BellOff size={16} strokeWidth={2.5} />}
                                    </button>
                                    <button
                                        type="button"
                                        className="p-1.5 border-2 border-black text-black bg-white hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                                        onClick={() => deleteAlert(alert._id)}
                                        title="Delete Alert"
                                    >
                                        <Trash2 size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(data?.alerts.length ?? 0) === 0 && (
                            <div className="font-mono font-bold text-black border-4 border-dashed border-black p-4 text-center uppercase text-sm flex flex-col items-center gap-2">
                                <Target size={24} className="text-black" />
                                <p>SET PRICE ALERTS FROM YOUR WATCHLIST.<br/>THEY WILL BE CHECKED ON EACH REFRESH.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AlertsPanel;
