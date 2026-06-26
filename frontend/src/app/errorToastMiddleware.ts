import type { Middleware } from "@reduxjs/toolkit";
import { isRejectedWithValue } from "@reduxjs/toolkit";
import { addToast } from "../features/toast/toastSlice";
import { AuthErrorType } from "../types/error.types";

/**
 * errorToastMiddleware
 *
 * Globally intercepts ALL rejected RTK Query actions.
 * Normalises the backend error message and dispatches the correct toast.
 *
 * Error classification:
 *  COMPROMISED  → 🔴 Security alert toast  (session wiped by baseQueryWithReauth)
 *  EXPIRED      → 🟡 Session expired toast  (baseQueryWithReauth already logged out)
 *  REFRESH_*    → 🟡 Session expired toast  (refresh endpoint failed)
 *  Timeout/net  → 🟠 Connection issue toast
 *  Everything   → no toast (generic errors handled per-component)
 */
export const errorToastMiddleware: Middleware = (store) => (next) => (action) => {
    if (isRejectedWithValue(action)) {
        const payload = action.payload as {
            status?: number | string;
            data?: { message?: string };
            error?: string;
        } | undefined;

        const status = payload?.status;
        const message = payload?.data?.message ?? payload?.error ?? "";

        // ── Network / fetch error (FETCH_ERROR)
        if (status === "FETCH_ERROR") {
            store.dispatch(
                addToast({ type: "info", message: "Connection issue. Retrying…" })
            );
            return next(action);
        }

        // ── 401 errors — classified by exact backend message
        if (status === 401) {
            if (message === AuthErrorType.COMPROMISED) {
                store.dispatch(
                    addToast({
                        type: "error",
                        message:
                            "Security Alert: Unusual activity detected. All sessions revoked. Please log in again.",
                    })
                );
                return next(action);
            }

            if (
                message === AuthErrorType.EXPIRED ||
                message === AuthErrorType.REFRESH_EXPIRED ||
                message === AuthErrorType.INVALID_REFRESH ||
                message === AuthErrorType.NO_REFRESH_TOKEN
            ) {
                store.dispatch(
                    addToast({
                        type: "warning",
                        message: "Your session has expired. Please log in again.",
                    })
                );
                return next(action);
            }
        }
    }

    return next(action);
};
