import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../app/store";
import { removeToast } from "../features/toast/toastSlice";
import type { ToastType } from "../features/toast/toastSlice";

const TOAST_DURATION_MS = 5000;

const styles: Record<
    ToastType,
    { border: string; icon: string; bg: string; color: string }
> = {
    error: {
        bg: "rgba(30,10,10,0.97)",
        border: "1px solid rgba(239,68,68,0.6)",
        color: "#fca5a5",
        icon: "🔴",
    },
    warning: {
        bg: "rgba(30,20,5,0.97)",
        border: "1px solid rgba(245,158,11,0.6)",
        color: "#fcd34d",
        icon: "🟡",
    },
    info: {
        bg: "rgba(10,20,30,0.97)",
        border: "1px solid rgba(96,165,250,0.5)",
        color: "#93c5fd",
        icon: "🟠",
    },
    success: {
        bg: "rgba(10,25,15,0.97)",
        border: "1px solid rgba(74,222,128,0.5)",
        color: "#86efac",
        icon: "🟢",
    },
};

const ToastItem = ({ id, type, message }: { id: string; type: ToastType; message: string }) => {
    const dispatch = useDispatch<AppDispatch>();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const s = styles[type];

    useEffect(() => {
        timerRef.current = setTimeout(() => dispatch(removeToast(id)), TOAST_DURATION_MS);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [id, dispatch]);

    return (
        <div
            role="alert"
            style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "14px 18px",
                borderRadius: "6px",
                background: s.bg,
                border: s.border,
                color: s.color,
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.75rem",
                letterSpacing: "0.03em",
                lineHeight: 1.5,
                boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                maxWidth: "360px",
                width: "100%",
                cursor: "pointer",
                animation: "toastSlideIn 0.25s ease-out",
            }}
            onClick={() => dispatch(removeToast(id))}
        >
            <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>{s.icon}</span>
            <span>{message}</span>
        </div>
    );
};

const ToastContainer = () => {
    const toasts = useSelector((state: RootState) => state.toast.toasts);

    return (
        <>
            {/* Keyframe injected once */}
            <style>{`
                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
            <div
                aria-live="polite"
                style={{
                    position: "fixed",
                    bottom: "24px",
                    right: "24px",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    alignItems: "flex-end",
                    pointerEvents: "none",
                }}
            >
                {toasts.map((toast) => (
                    <div key={toast.id} style={{ pointerEvents: "auto" }}>
                        <ToastItem {...toast} />
                    </div>
                ))}
            </div>
        </>
    );
};

export default ToastContainer;
