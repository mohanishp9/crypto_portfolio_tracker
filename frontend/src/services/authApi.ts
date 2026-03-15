import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// TypeScript Interfaces
interface User {
    _id: string;
    name: string;
    email: string;
}

interface AuthResponse {
    success: boolean;
    user: User;
    jwtToken: string;
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


// Create Auth API Slice
export const authApi = createApi({
    reducerPath: 'authApi',

    // Base query configuration
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_BASE_URL,
        credentials: 'include', // Important: Send cookies with requests
    }),

    // Tag types for cache invalidation
    tagTypes: ['User'],

    // Define endpoints
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
    }),
});


// Export auto-generated hooks
export const {
    useRegisterMutation,
    useLoginMutation,
    useLogoutMutation,
    useGetCurrentUserQuery,
} = authApi;