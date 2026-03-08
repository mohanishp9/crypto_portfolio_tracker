import { Types } from "mongoose";

export interface IHolding {
    coinId: string;
    coinName: string;
    coinSymbol: string;
    quantity: number;
    buyPrice: number;
    purchaseDate: Date;
    _id?: Types.ObjectId;
}

export interface IPortfolio {
    _id?: Types.ObjectId;
    user: Types.ObjectId;
    holdings: Types.DocumentArray<IHolding>;
    createdAt: Date;
    updatedAt: Date;
}