import { asyncHandler } from "../utils/asyncHandler"
import User from "../models/User.model";
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    // 1. Only look for Access Token in the Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;

    if (!token) {
        res.status(401);
        throw new Error("Not authenticated, no access token");
    }
    
    // 2. Verify the Access Token
    const decoded = verifyAccessToken(token);
    
    if ("error" in decoded) {
        res.status(401);
        if (decoded.error === 'expired') {
            throw new Error("TokenExpiredError"); // Interceptor explicitly looks for expired
        }
        throw new Error("Not authenticated, access token invalid");
    }

    // 3. Attach user context
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
        res.status(401);
        throw new Error("User not found");
    }

    req.user = user;
    next();
})

export { protect };