import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// --- Types ---
export interface User {
    id: string;
    name: string;
    email: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
}

// --- Initial State ---
const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        // Placeholder reducer — you will add login logic later
        setCredentials: (
            state,
            action: PayloadAction<{ user: User; token: string }>
        ) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
        },

        // Logout = clear everything
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
        },
    },
});

// Export actions
export const { setCredentials, logout } = authSlice.actions;

// Export reducer
export default authSlice.reducer;