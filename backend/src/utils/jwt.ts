import jwt from "jsonwebtoken";
import crypto from "crypto";

export interface JWTPayload {
    id: string;
    iat?: number;
    exp?: number;
}

export const generateAccessToken = (userId: string): string => {
    // Fallback to 15m if environment variable is not set
    const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET as string;
    
    return jwt.sign({ id: userId }, secret, { expiresIn: expiresIn as any });
}

export const verifyAccessToken = (token: string): JWTPayload | { error: string } => {
    try {
        const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET as string;
        const decode = jwt.verify(token, secret) as JWTPayload;
        return decode;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return { error: 'expired' };
        }
        return { error: 'invalid' };
    }
}

export interface RefreshTokenResult {
    token: string;
    familyId: string;
}

export const generateRefreshToken = (existingFamilyId?: string): RefreshTokenResult => {
    // Generate a secure, 64-byte hex string (opaque token)
    const token = crypto.randomBytes(64).toString("hex");
    // Generate a UUID for tracking token lineages, or reuse the existing one
    const familyId = existingFamilyId || crypto.randomUUID();
    
    return { token, familyId };
}

/**
 * Creates a deterministic SHA-256 hash of a token.
 * This allows us to query the database directly for the hash without needing the userId.
 */
export const hashToken = (token: string): string => {
    return crypto.createHash("sha256").update(token).digest("hex");
}