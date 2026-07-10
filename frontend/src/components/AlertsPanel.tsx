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
        <div className="p-6 bg-surface-secondary border border-border-primary rounded-sm shadow-sm">
            <p className="text-xs font-medium text-text-tertiary">
                Alerts
            </p>
            <h3 className="font-semibold text-lg text-text-primary tracking-tight mt-2 flex items-center gap-2">
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
                            <div key={alert._id} className="flex items-center justify-between gap-4 p-4 bg-surface-primary border border-border-primary rounded-sm hover:border-border-secondary transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-text-primary">{alert.coinName}</span>
                                        {alert.isTriggered && (
                                            <span className="px-1.5 py-0.5 rounded text-xs   font-semibold bg-negative-subtle text-negative border border-negative/20">
                                                Triggered
                                            </span>
                                        )}
                                        {!alert.isActive && !alert.isTriggered && (
                                            <span className="px-1.5 py-0.5 rounded text-xs   font-semibold bg-surface-tertiary text-text-tertiary border border-border-secondary">
                                                Paused
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs mt-1.5 flex items-center gap-1.5 flex-wrap">
                                        <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm ${alert.direction === "ABOVE" ? "bg-positive-subtle text-positive" : "bg-negative-subtle text-negative"}`}>
                                            {alert.direction === "ABOVE" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                            {alert.direction}
                                        </span>
                                        <span className="text-text-secondary font-medium">
                                            ${alert.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                        </span>
                                        <span className="text-zinc-600">|</span>
                                        <span className="text-text-tertiary">
                                            now ${alert.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0 border-l border-border-primary pl-3">
                                    <button
                                        type="button"
                                        className={`p-1.5 rounded-sm transition-colors flex items-center justify-center ${alert.isActive ? "text-accent hover:bg-surface-tertiary" : "text-text-tertiary hover:text-accent hover:bg-surface-tertiary"}`}
                                        onClick={() => updateAlert({ id: alert._id, patch: { isActive: !alert.isActive } })}
                                        title={alert.isActive ? "Pause Alert" : "Resume Alert"}
                                    >
                                        {alert.isActive ? <Bell size={14} /> : <BellOff size={14} />}
                                    </button>
                                    <button
                                        type="button"
                                        className="p-1.5 rounded-sm text-text-tertiary hover:text-negative hover:bg-surface-tertiary transition-colors flex items-center justify-center"
                                        onClick={() => deleteAlert(alert._id)}
                                        title="Delete Alert"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(data?.alerts.length ?? 0) === 0 && (
                            <div className="text-sm text-text-tertiary text-center py-6 px-4 border border-dashed border-border-primary rounded-sm flex flex-col items-center gap-2">
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
