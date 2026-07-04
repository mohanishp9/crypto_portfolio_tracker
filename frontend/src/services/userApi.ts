import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';
import type { User } from '../features/auth/authSlice';

// Interfaces
interface CheckNameResponse {
    available: boolean;
    message?: string;
}

interface UpdateNameInput {
    name: string;
}

interface UpdateNameResponse {
    success: boolean;
    user: User;
    message?: string;
}

interface ChangePasswordInput {
    currentPassword: string;
    newPassword: string;
}

interface InitiateEmailChangeInput {
    currentPassword: string;
    newEmail: string;
}

interface InitiateAccountDeletionInput {
    currentPassword: string;
}

interface VerifyActionOtpInput {
    otp: string;
}

interface GenericResponse {
    success: boolean;
    message: string;
}

// User API Slice
export const userApi = createApi({
    reducerPath: 'userApi',
    baseQuery,
    tagTypes: ['User'],
    endpoints: (builder) => ({
        // Check Name
        checkName: builder.query<CheckNameResponse, string>({
            query: (name) => `/users/me/check-name?name=${name}`,
        }),
        
        // Update Name
        updateName: builder.mutation<UpdateNameResponse, UpdateNameInput>({
            query: (data) => ({
                url: '/users/me/name',
                method: 'PUT',
                body: data,
            }),
        }),

        // Change Password
        changePassword: builder.mutation<GenericResponse, ChangePasswordInput>({
            query: (data) => ({
                url: '/users/me/password',
                method: 'PUT',
                body: data,
            }),
        }),

        // Initiate Email Change
        initiateEmailChange: builder.mutation<GenericResponse, InitiateEmailChangeInput>({
            query: (data) => ({
                url: '/users/me/email/initiate',
                method: 'POST',
                body: data,
            }),
        }),

        // Verify Email Change
        verifyEmailChange: builder.mutation<{ success: boolean; message: string; user: User }, VerifyActionOtpInput>({
            query: (data) => ({
                url: '/users/me/email/verify',
                method: 'PUT',
                body: data,
            }),
        }),

        // Initiate Account Deletion
        initiateAccountDeletion: builder.mutation<GenericResponse, InitiateAccountDeletionInput>({
            query: (data) => ({
                url: '/users/me/delete/initiate',
                method: 'POST',
                body: data,
            }),
        }),

        // Delete Account
        deleteAccount: builder.mutation<GenericResponse, VerifyActionOtpInput>({
            query: (data) => ({
                url: '/users/me',
                method: 'DELETE',
                body: data,
            }),
        }),
    }),
});

export const {
    useCheckNameQuery,
    useLazyCheckNameQuery,
    useUpdateNameMutation,
    useChangePasswordMutation,
    useInitiateEmailChangeMutation,
    useVerifyEmailChangeMutation,
    useInitiateAccountDeletionMutation,
    useDeleteAccountMutation,
} = userApi;
