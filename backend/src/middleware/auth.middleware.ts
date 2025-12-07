import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler"
import User from "../models/User.model";
import { Request, Response, NextFunction } from "express";
import { JWTPayload } from "../utils/jwt";



const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const token = req.cookies.token;

    if (!token) {
        res.status(401);
        throw new Error("Not authenticated");
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            res.status(401);
            throw new Error("User not found")
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401);
        throw new Error("Invalid token");
    }
})

export { protect };