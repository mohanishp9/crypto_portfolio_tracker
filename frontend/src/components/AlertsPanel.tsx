import {
    useDeleteAlertMutation,
    useGetAlertsQuery,
    useUpdateAlertMutation,
} from "../services/portfolioApi";

const AlertsPanel = () => {
    const { data } = useGetAlertsQuery();
    const [deleteAlert] = useDeleteAlertMutation();
    const [updateAlert] = useUpdateAlertMutation();

    return (
        <div className="p-6" style={{ background: "#2e3330", border: "1px solid rgba(61,74,62,0.3)" }}>
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6b7c6a" }}>
                Alerts
            </p>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", color: "#ede8dd", marginTop: "12px" }}>
                Price Targets
            </h3>
            <div className="space-y-3 mt-6">
                {(data?.alerts ?? []).map((alert) => (
                    <div key={alert._id} className="flex items-center justify-between gap-4 p-3" style={{ background: "#1f2320", border: "1px solid rgba(61,74,62,0.25)" }}>
                        <div>
                            <div style={{ color: "#ede8dd", fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>{alert.coinName}</div>
                            <div style={{ color: "#9aab97", fontSize: "0.65rem" }}>
                                {alert.direction} ${alert.targetPrice.toFixed(2)} | now ${alert.currentPrice.toFixed(2)}
                            </div>
                            {alert.isTriggered && (
                                <div style={{ color: "#c4885a", fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "6px" }}>
                                    Triggered
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                style={smallButtonStyle}
                                onClick={() => updateAlert({ id: alert._id, patch: { isActive: !alert.isActive } })}
                            >
                                {alert.isActive ? "Pause" : "Resume"}
                            </button>
                            <button
                                type="button"
                                style={{ ...smallButtonStyle, color: "#8b5e3c", borderColor: "rgba(139,94,60,0.25)" }}
                                onClick={() => deleteAlert(alert._id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
                {(data?.alerts.length ?? 0) === 0 && (
                    <p style={{ color: "#6b7c6a", fontSize: "0.75rem", lineHeight: 1.8 }}>
                        Create quick alerts from the watchlist and they will be checked on the normal refresh cycle.
                    </p>
                )}
            </div>
        </div>
    );
};

const smallButtonStyle: React.CSSProperties = {
    background: "transparent",
    border: "1px solid rgba(107,124,106,0.25)",
    color: "#9aab97",
    padding: "8px 10px",
    fontSize: "0.5rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontFamily: "'DM Mono', monospace",
    cursor: "pointer",
};

export default AlertsPanel;
