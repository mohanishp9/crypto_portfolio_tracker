import { Types } from "mongoose";

export interface IWatchlistItem {
    user: Types.ObjectId;
    coinId: string;
    coinSymbol: string;
    coinName: string;
    createdAt?: Date;
    updatedAt?: Date;
}
