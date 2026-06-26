export interface ApiErrorData {
    success: boolean;
    message: string;
}

export interface ApiErrorResponse {
    status: number;
    data: ApiErrorData;
}

// These strings MUST exactly match what the backend throws
// Verified against: backend/src/controllers/auth.controller.ts
// and backend/src/middleware/auth.middleware.ts
export const AuthErrorType = {
    // From auth.middleware.ts
    EXPIRED: "TokenExpiredError",
    NO_ACCESS_TOKEN: "Not authenticated, no access token",
    INVALID_ACCESS_TOKEN: "Not authenticated, access token invalid",

    // From auth.controller.ts (refreshTokenController)
    COMPROMISED: "Compromised token detected. All sessions revoked. Please login again.",
    INVALID_REFRESH: "Invalid refresh token",
    NO_REFRESH_TOKEN: "No refresh token provided",
    REFRESH_EXPIRED: "Refresh token expired",
} as const;

export type AuthErrorType = typeof AuthErrorType[keyof typeof AuthErrorType];

export const isExpiredError = (message: string) =>
    message === AuthErrorType.EXPIRED;

export const isCompromisedError = (message: string) =>
    message === AuthErrorType.COMPROMISED;

export const isApiErrorResponse = (error: unknown): error is ApiErrorResponse => {
    return (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        'data' in error &&
        typeof (error as any).data?.message === 'string'
    );
};
