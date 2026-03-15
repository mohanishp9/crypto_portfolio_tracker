import { Types } from "mongoose";

export interface ITransaction {
    user?: Types.ObjectId;
    coinId: string;
    coinSymbol: string;
    coinName: string;
    type: "BUY" | "SELL";
    quantity: number;
    price: number;
    fee?: number;
    timestamp: Date;
}

export type TransactionType = "BUY" | "SELL";

export interface Transaction {
    coinId: string;
    quantity: number;
    price: number;
    fee?: number;
    type: TransactionType;
}

export interface Holding {
    quantity: number;
    totalCost: number;
    realizedProfit: number;
}