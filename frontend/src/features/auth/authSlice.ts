import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface User {
    _id: string;
    name: string;
    email: string;
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
}

const initialState: AuthState = {
    user: null, // User is strictly managed in Redux now to prevent partial logged-in states
    accessToken: null, // STRICTLY IN MEMORY (Zero XSS exposure)
    isAuthenticated: false,
    isInitialized: false, // True when the silent refresh completes on app load
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ user: User; accessToken: string }>
        ) => {
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            state.isAuthenticated = true;
            state.isInitialized = true;
        },
        logout: (state) => {
            state.user = null;
            state.accessToken = null;
            state.isAuthenticated = false;
            state.isInitialized = true; // Still initialized, just not authenticated
        },
        setAuthInitialized: (state) => {
            state.isInitialized = true;
        }
    },
});

export const { setCredentials, logout, setAuthInitialized } = authSlice.actions;

export default authSlice.reducer;