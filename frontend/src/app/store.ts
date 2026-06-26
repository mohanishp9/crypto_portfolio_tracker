import { configureStore } from "@reduxjs/toolkit";
import authSlice from "../features/auth/authSlice";
import { authApi } from "../services/authApi";
import portfolioSlice from "../features/portfolio/portfolioSlice";
import { portfolioApi } from "../services/portfolioApi";
import toastSlice from "../features/toast/toastSlice";
import { errorToastMiddleware } from "./errorToastMiddleware";

export const store = configureStore({
    reducer: {
        auth: authSlice,
        portfolio: portfolioSlice,
        toast: toastSlice,
        [authApi.reducerPath]: authApi.reducer,
        [portfolioApi.reducerPath]: portfolioApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(authApi.middleware, portfolioApi.middleware)
            .concat(errorToastMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;