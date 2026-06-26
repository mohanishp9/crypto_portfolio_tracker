import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';

// TypeScript Interfaces
interface User {
    _id: string;
    name: string;
    email: string;
}

interface AuthResponse {
    success: boolean;
    user: User;
    accessToken: string;
}

interface RegisterInput {
    name: string;
    email: string;
    password: string;
}

interface LoginInput {
    email: string;
    password: string;
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
        // Register mutation
        register: builder.mutation<AuthResponse, RegisterInput>({
            query: (credentials) => ({
                url: '/auth/register',
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
    }),
});


// Export auto-generated hooks
export const {
    useRegisterMutation,
    useLoginMutation,
    useLogoutMutation,
    useGetCurrentUserQuery,
    useRefreshMutation,
} = authApi;