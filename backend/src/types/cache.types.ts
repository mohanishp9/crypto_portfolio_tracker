export interface IApiCache {
    key: string;
    data: unknown;
    expiresAt: Date;
    staleUntil?: Date | null;
    lastUpdatedAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
