import { Document, Types } from "mongoose";

export interface IRefreshToken extends Document {
    userId: Types.ObjectId;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    isRevoked: boolean;
    createdAt: Date;
    updatedAt: Date;
}
