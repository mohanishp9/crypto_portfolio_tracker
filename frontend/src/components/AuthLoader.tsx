import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials, setAuthInitialized } from '../features/auth/authSlice';
import { refreshAccessToken } from '../services/baseQuery';
import type { AppDispatch } from '../app/store';

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
                // 1. Try to get a fresh access token from the HttpOnly cookie
                const accessToken = await refreshAccessToken();

                if (cancelled) return;

                if (!accessToken) {
                    // Refresh failed (no valid cookie, expired, etc.) → guest mode
                    dispatch(setAuthInitialized());
                    return;
                }

                // 2. Token obtained → fetch user profile to fully hydrate Redux
                // We use a raw fetch here to avoid RTK Query cache complications on init
                const userRes = await fetch(
                    `${import.meta.env.VITE_API_URL}/auth/me`,
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        credentials: 'include',
                    }
                );

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
                    // Network failure, server down, etc. → safe fallback to guest
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
