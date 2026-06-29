import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials, setAuthInitialized } from '../features/auth/authSlice';
import type { AppDispatch } from '../app/store';

const API_URL = import.meta.env.VITE_API_URL;

// Module-level singleton: ensures only ONE /auth/refresh call fires on app init,
// even if React StrictMode double-invokes the effect in development.
let _initRefreshPromise: Promise<string | null> | null = null;

const getInitialAccessToken = (): Promise<string | null> => {
    if (!_initRefreshPromise) {
        _initRefreshPromise = fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        })
            .then(async (res) => {
                if (!res.ok) return null;
                const data = await res.json();
                return (data.accessToken as string) ?? null;
            })
            .catch(() => null);
    }
    return _initRefreshPromise;
};

/**
 * AuthLoader
 *
 * Wraps the entire app. On mount it calls POST /auth/refresh using the
 * HttpOnly cookie. This silently restores the session before any routes
 * or API calls fire, preventing:
 *  - Flash of logged-out state
 *  - Race conditions between page load and token acquisition
 *  - ProtectedRoute redirecting to login while a valid session exists
 *
 * Flow:
 *   App mounts → AuthLoader fires refresh (raw fetch, not RTK Query)
 *     ├── Success → dispatch setCredentials (token + user) → render app
 *     └── Failure → dispatch setAuthInitialized → render app as guest
 */

interface AuthLoaderProps {
    children: React.ReactNode;
}

const AuthLoader = ({ children }: AuthLoaderProps) => {
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        let cancelled = false;

        const restoreSession = async () => {
            try {
                // 1. Singleton fetch: both StrictMode invocations share the same promise,
                //    so only ONE /auth/refresh request ever hits the server.
                const accessToken = await getInitialAccessToken();

                if (cancelled) return;

                if (!accessToken) {
                    dispatch(setAuthInitialized());
                    return;
                }

                // 2. Token obtained → fetch user profile to fully hydrate Redux
                const userRes = await fetch(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    credentials: 'include',
                });

                if (cancelled) return;

                if (!userRes.ok) {
                    dispatch(setAuthInitialized());
                    return;
                }

                const { user } = await userRes.json();

                // 3. Fully authenticated → hydrate Redux
                dispatch(setCredentials({ user, accessToken }));
            } catch {
                if (!cancelled) {
                    dispatch(setAuthInitialized());
                }
            }
        };

        restoreSession();

        return () => {
            cancelled = true; // Prevent state updates on unmounted component
        };
    }, [dispatch]);

    return <>{children}</>;
};

export default AuthLoader;
