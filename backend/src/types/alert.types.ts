import { Types } from "mongoose";

export interface IPriceAlert {
    user: Types.ObjectId;
    coinId: string;
    coinSymbol: string;
    coinName: string;
    direction: "ABOVE" | "BELOW";
    targetPrice: number;
    isActive: boolean;
    isTriggered: boolean;
    lastTriggeredAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}
