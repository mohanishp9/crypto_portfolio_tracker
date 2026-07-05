import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';

// TypeScript Interfaces
interface User {
    _id: string;
    name: string;
    username?: string;
    email: string;
}

interface AuthResponse {
    success: boolean;
    user: User;
    accessToken: string;
}

interface RegisterInput {
    name: string;
    username?: string;
    email: string;
    password: string;
}

interface InitiateResponse {
    success: boolean;
    message: string;
}

interface VerifyOtpInput {
    email: string;
    otp: string;
}

interface LoginInput {
    email: string;
    password: string;
}

interface InitiatePasswordResetInput {
    email: string;
}

interface VerifyPasswordResetInput {
    email: string;
    otp: string;
    newPassword: string;
}

interface LogoutResponse {
    success: boolean;
    message: string;
}

interface GetCurrentUserResponse {
    success: boolean;
    user: User;
}

interface RefreshResponse {
    success: boolean;
    accessToken: string;
}

// Create Auth API Slice
export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery, // Redux-aware: reads accessToken from state, NOT localStorage
    tagTypes: ['User'],
    endpoints: (builder) => ({
        // Initiate registration
        initiateRegistration: builder.mutation<InitiateResponse, RegisterInput>({
            query: (credentials) => ({
                url: '/auth/register/initiate',
                method: 'POST',
                body: credentials,
            }),
        }),

        // Verify OTP
        verifyRegistration: builder.mutation<AuthResponse, VerifyOtpInput>({
            query: (credentials) => ({
                url: '/auth/register/verify',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: ['User'],
        }),

        // Login mutation
        login: builder.mutation<AuthResponse, LoginInput>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: ['User'],
        }),

        // Logout mutation
        logout: builder.mutation<LogoutResponse, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
            invalidatesTags: ['User'],
        }),

        // Get current user query
        getCurrentUser: builder.query<GetCurrentUserResponse, void>({
            query: () => '/auth/me',
            providesTags: ['User'],
        }),

        // Refresh access token (uses HttpOnly cookie automatically)
        refresh: builder.mutation<RefreshResponse, void>({
            query: () => ({
                url: '/auth/refresh',
                method: 'POST',
            }),
        }),

        // Initiate password reset
        initiatePasswordReset: builder.mutation<InitiateResponse, InitiatePasswordResetInput>({
            query: (data) => ({
                url: '/auth/password-reset/initiate',
                method: 'POST',
                body: data,
            }),
        }),

        // Verify password reset
        verifyPasswordReset: builder.mutation<InitiateResponse, VerifyPasswordResetInput>({
            query: (data) => ({
                url: '/auth/password-reset/verify',
                method: 'POST',
                body: data,
            }),
        }),
    }),
});


// Export auto-generated hooks
export const {
    useInitiateRegistrationMutation,
    useVerifyRegistrationMutation,
    useLoginMutation,
    useLogoutMutation,
    useGetCurrentUserQuery,
    useRefreshMutation,
    useInitiatePasswordResetMutation,
    useVerifyPasswordResetMutation,
} = authApi;