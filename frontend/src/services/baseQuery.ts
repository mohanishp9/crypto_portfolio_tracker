import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { RootState } from "../app/store";
import type { AppDispatch } from "../app/store";
import { setCredentials, logout } from "../features/auth/authSlice";
import { isExpiredError, isCompromisedError } from "../types/error.types";

const API_URL = import.meta.env.VITE_API_URL;

// 1. Raw base query — reads accessToken from Redux, sends HttpOnly cookie
const rawBaseQuery = fetchBaseQuery({
    baseUrl: API_URL,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.accessToken;
        if (token) headers.set("authorization", `Bearer ${token}`);
        return headers;
    },
});

// 2. Promise-based Mutex — zero external dependencies
//    Ensures only ONE /auth/refresh call fires even if 10 requests fail at once.
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

const subscribeToRefresh = (callback: (token: string | null) => void) => {
    refreshSubscribers.push(callback);
};

const notifySubscribers = (token: string | null) => {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
};

// 3. Raw fetch refresh call with a 10-second timeout
//    Raw fetch avoids circular dependency with RTK Query.
const REFRESH_TIMEOUT_MS = 10_000;

export const refreshAccessToken = async (): Promise<string | null> => {
    const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), REFRESH_TIMEOUT_MS)
    );

    const fetchPromise = fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
    }).then(async (res) => {
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            return Promise.reject(body?.message ?? "Refresh failed");
        }
        const data = await res.json();
        return data.accessToken as string;
    });

    // If the refresh hangs, timeout wins and returns null
    return Promise.race([fetchPromise, timeoutPromise]).catch(() => null);
};

// 4. Extract the backend error message from an RTK Query error response
const extractErrorMessage = (error: FetchBaseQueryError): string | null => {
    if (error.status === 401 && typeof error.data === "object" && error.data !== null) {
        return (error.data as { message?: string }).message ?? null;
    }
    return null;
};

// 5. baseQueryWithReauth — the full engine
//    Used by authApi, portfolioApi, and any future API slice.
export const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    // Run the original request
    let result = await rawBaseQuery(args, api, extraOptions);
    const dispatch = api.dispatch as AppDispatch;

    // Only act on 401s
    if (result.error?.status !== 401) return result;

    const errorMessage = extractErrorMessage(result.error);

    // ── CASE A: Compromised family → wipe everything immediately
    if (errorMessage && isCompromisedError(errorMessage)) {
        dispatch(logout());
        // Toast will be handled in Phase 4 middleware
        return result;
    }

    // ── CASE B: Token is NOT an expiry error → standard force logout
    if (!errorMessage || !isExpiredError(errorMessage)) {
        // Only logout if we were actually authenticated (avoids double-logout on login page)
        const isAuthenticated = (api.getState() as RootState).auth.isAuthenticated;
        if (isAuthenticated) dispatch(logout());
        return result;
    }

    // ── CASE C: Token expired → attempt silent refresh

    if (isRefreshing) {
        // Another request is already refreshing — queue this one
        const newToken = await new Promise<string | null>((resolve) => {
            subscribeToRefresh(resolve);
        });

        if (!newToken) return result; // Refresh failed; return original 401

        // Retry with the new token injected directly into the header
        return rawBaseQuery(
            {
                ...(typeof args === "string" ? { url: args } : args),
                headers: { authorization: `Bearer ${newToken}` },
            },
            api,
            extraOptions
        );
    }

    // This request is the first — acquire the lock and refresh
    isRefreshing = true;

    try {
        const newToken = await refreshAccessToken();

        if (!newToken) {
            // Refresh timed out or returned null → logout all queued requests
            notifySubscribers(null);
            dispatch(logout());
            return result;
        }

        // Fetch the user to fully hydrate state
        const userRes = await fetch(`${API_URL}/auth/me`, {
            headers: { authorization: `Bearer ${newToken}` },
            credentials: "include",
        });

        if (!userRes.ok) {
            notifySubscribers(null);
            dispatch(logout());
            return result;
        }

        const { user } = await userRes.json();
        dispatch(setCredentials({ user, accessToken: newToken }));

        // Notify all queued requests with the fresh token
        notifySubscribers(newToken);

        // Retry the original request that triggered the 401
        result = await rawBaseQuery(
            {
                ...(typeof args === "string" ? { url: args } : args),
                headers: { authorization: `Bearer ${newToken}` },
            },
            api,
            extraOptions
        );
    } catch {
        notifySubscribers(null);
        dispatch(logout());
    } finally {
        isRefreshing = false;
    }

    return result;
};

// Keep the simple baseQuery available for auth endpoints that must NOT reauth
// (login, register, refresh itself) to prevent infinite loops.
export const baseQuery = rawBaseQuery;

