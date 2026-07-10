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
            className="flex items-start gap-2.5 py-3.5 px-[18px] rounded-md text-xs tracking-[0.03em] leading-relaxed max-w-[360px] w-full cursor-pointer animate-[toastSlideIn_0.25s_ease-out]"
            style={{
                background: s.bg,
                border: s.border,
                color: s.color,
                boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
            }}
            onClick={() => dispatch(removeToast(id))}
        >
            <span className="text-[0.85rem] shrink-0">{s.icon}</span>
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
                @media (prefers-reduced-motion: no-preference) {
                    @keyframes toastSlideIn {
                        from { opacity: 0; transform: translateX(20px); }
                        to   { opacity: 1; transform: translateX(0); }
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    @keyframes toastSlideIn {
                        from { opacity: 0; transform: none; }
                        to   { opacity: 1; transform: none; }
                    }
                }
            `}</style>
            <div
                aria-live="polite"
                className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none"
            >
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastItem {...toast} />
                    </div>
                ))}
            </div>
        </>
    );
};

export default ToastContainer;