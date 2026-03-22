import ApiCache from "../models/ApiCache.model";

type CacheRecord<T> = {
    data: T;
    lastUpdatedAt: Date;
    stale: boolean;
};

type CacheOptions = {
    ttlMs: number;
    staleTtlMs?: number;
};

const inFlight = new Map<string, Promise<unknown>>();

export const getPersistentCache = async <T>(key: string): Promise<CacheRecord<T> | null> => {
    const entry = await ApiCache.findOne({ key }).lean();
    if (!entry) {
        return null;
    }

    const now = Date.now();
    const expiresAt = new Date(entry.expiresAt).getTime();
    const staleUntil = entry.staleUntil ? new Date(entry.staleUntil).getTime() : expiresAt;

    if (now > staleUntil) {
        return null;
    }

    return {
        data: entry.data as T,
        lastUpdatedAt: new Date(entry.lastUpdatedAt),
        stale: now > expiresAt,
    };
};

export const setPersistentCache = async <T>(key: string, data: T, options: CacheOptions) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + options.ttlMs);
    const staleUntil = new Date(now.getTime() + (options.staleTtlMs ?? options.ttlMs));

    await ApiCache.findOneAndUpdate(
        { key },
        {
            key,
            data,
            expiresAt,
            staleUntil,
            lastUpdatedAt: now,
        },
        { upsert: true, setDefaultsOnInsert: true }
    );
};

export const getCachedOrFetch = async <T>(
    key: string,
    options: CacheOptions,
    fetcher: () => Promise<T>
): Promise<CacheRecord<T>> => {
    const cached = await getPersistentCache<T>(key);
    if (cached && !cached.stale) {
        return cached;
    }

    const existingRequest = inFlight.get(key) as Promise<CacheRecord<T>> | undefined;
    if (existingRequest) {
        return existingRequest;
    }

    const request = (async () => {
        try {
            const data = await fetcher();
            await setPersistentCache(key, data, options);
            return {
                data,
                lastUpdatedAt: new Date(),
                stale: false,
            };
        } catch (error) {
            const fallback = await getPersistentCache<T>(key);
            if (fallback) {
                return {
                    ...fallback,
                    stale: true,
                };
            }
            throw error;
        } finally {
            inFlight.delete(key);
        }
    })();

    inFlight.set(key, request as Promise<unknown>);
    return request;
};
