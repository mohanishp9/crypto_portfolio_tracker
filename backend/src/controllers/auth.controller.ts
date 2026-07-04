import { asyncHandler } from "../utils/asyncHandler";
import { registerSchema, RegisterInput, loginSchema, LoginInput, verifyOtpSchema, VerifyOtpInput } from "../utils/validation";
import User from "../models/User.model";
import RefreshToken from "../models/RefreshToken.model";
import { generateAccessToken, generateRefreshToken, hashToken } from "../utils/jwt";
import { Request, Response } from "express";

const setRefreshTokenCookie = (res: Response, token: string) => {
    const days = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || "7", 10);
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "strict",
        maxAge: days * 24 * 60 * 60 * 1000,
    });
};

const createRefreshTokenRecord = async (userId: string, token: string, familyId: string) => {
    const days = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || "7", 10);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    await RefreshToken.create({
        userId,
        tokenHash: hashToken(token),
        familyId,
        expiresAt,
    });
};

import bcrypt from "bcryptjs";
import { redis } from "../config/redis";
import { sendTransactionalEmail } from "../services/email.service";

// @desc Initiate user registration (Sends OTP)
// @route POST /register/initiate
// @access Public
const initiateRegistrationController = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password }: RegisterInput = validatedData;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(409);
        throw new Error("User already exists");
    }

    if (!redis) {
        res.status(500);
        throw new Error("Redis is not available. Cannot process registration.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const payload = {
        name,
        email,
        hashedPassword,
        otp,
        attempts: 3
    };

    const redisKey = `registration:otp:${email}`;
    await redis.set(redisKey, JSON.stringify(payload), "EX", 600); // 10 minutes expiry

    const emailSent = await sendTransactionalEmail({
        to: email,
        recipientName: name,
        subject: "Your Registration Verification Code",
        htmlContent: `
        <html>
            <body style="font-family: sans-serif; padding: 20px;">
                <h2>Verify Your Registration</h2>
                <p>Your One-Time Password (OTP) is:</p>
                <h1 style="background: #f3f4f6; padding: 10px; display: inline-block; letter-spacing: 2px;">${otp}</h1>
                <p>It is valid for 10 minutes.</p>
            </body>
        </html>
        `
    });

    if (!emailSent) {
        // If email fails (e.g. invalid IP at Brevo), delete the Redis key and throw error
        await redis.del(redisKey);
        res.status(500);
        throw new Error("Failed to send OTP email. Please try again later.");
    }

    res.status(200).json({
        success: true,
        message: "OTP sent successfully to email"
    });
});

// @desc Verify OTP and complete registration
// @route POST /register/verify
// @access Public
const verifyRegistrationController = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = verifyOtpSchema.parse(req.body);
    const { email, otp }: VerifyOtpInput = validatedData;

    if (!redis) {
        res.status(500);
        throw new Error("Redis is not available.");
    }

    const redisKey = `registration:otp:${email}`;
    
    // WATCH the key for optimistic locking
    await redis.watch(redisKey);

    const dataString = await redis.get(redisKey);
    if (!dataString) {
        await redis.unwatch();
        res.status(400);
        throw new Error("OTP expired or invalid");
    }

    const data = JSON.parse(dataString);

    if (data.attempts <= 0) {
        await redis.unwatch();
        res.status(400);
        throw new Error("Too many failed attempts. Please register again.");
    }

    if (data.otp !== otp) {
        data.attempts -= 1;

        const multi = redis.multi();
        multi.set(redisKey, JSON.stringify(data), "KEEPTTL");

        const results = await multi.exec();

        if (!results) {
            res.status(409);
            throw new Error("Conflict: Concurrent request detected.");
        }

        res.status(400);
        throw new Error(`Invalid OTP. ${data.attempts} attempts left.`);
    }

    await redis.unwatch();

    const user = await User.create({
        name: data.name,
        email: data.email,
        password: data.hashedPassword,
    });

    await redis.del(redisKey);

    if (user) {
        const accessToken = generateAccessToken(user._id.toString());
        const { token, familyId } = generateRefreshToken();

        await createRefreshTokenRecord(user._id.toString(), token, familyId);
        setRefreshTokenCookie(res, token);

        res.status(201).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
            accessToken,
        });
    } else {
        res.status(400);
        throw new Error("Invalid user data");
    }
});

// @desc Login a user
// @route POST /login
// @access Public
const loginUserController = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = loginSchema.parse(req.body);

    const { email, password }: LoginInput = validatedData;

    const user = await User.findOne({ email });

    if (!user) {
        res.status(401);
        throw new Error("Invalid credentials");
    }

    if (await user.comparePassword(password)) {
        const accessToken = generateAccessToken(user._id.toString());
        const { token, familyId } = generateRefreshToken();

        await createRefreshTokenRecord(user._id.toString(), token, familyId);
        setRefreshTokenCookie(res, token);

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
            accessToken,
        });
    } else {
        res.status(401);
        throw new Error("Invalid credentials");
    }
});

// @desc Logout a user
// @route POST /logout
// @access Private
const logoutUserController = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
        const tokenHash = hashToken(refreshToken);
        await RefreshToken.findOneAndDelete({ tokenHash });
    }

    const isProd = process.env.NODE_ENV === "production";
    const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "strict",
    } as const;

    res.clearCookie("refreshToken", cookieOptions);
    // Clear old token cookie in case users still have it from the previous system
    res.clearCookie("token", cookieOptions);

    res.status(200).json({
        success: true,
        message: "User logged out successfully",
    });
});

// @desc Get current user profile
// @route GET /profile
// @access Private
const getCurrentUserProfileController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        res.status(401);
        throw new Error("User not found");
    }

    const user = {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
    };
    res.status(200).json({
        success: true,
        user,
    });
});

// @desc Refresh access token
// @route POST /refresh
// @access Public (Requires Refresh Token Cookie)
const refreshTokenController = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        res.status(401);
        throw new Error("No refresh token provided");
    }

    const tokenHash = hashToken(refreshToken);
    
    // ATOMIC UPDATE: Find the token and immediately mark it as revoked (fixes race condition)
    // If it's already revoked, this will return null, pushing us to the reuse detection fallback.
    let tokenDoc = await RefreshToken.findOneAndUpdate(
        { tokenHash, isRevoked: false },
        { $set: { isRevoked: true } },
        { new: false } // Returns the document BEFORE it was updated
    );

    if (!tokenDoc) {
        // If not found, it's either an invalid token OR an already-revoked token being reused!
        const revokedToken = await RefreshToken.findOne({ tokenHash, isRevoked: true });
        
        if (revokedToken) {
            // Grace Period: If the token was revoked very recently (e.g., within 15 seconds),
            // it's almost certainly a race condition from a fast page reload, not a hacker.
            const timeSinceRevocation = Date.now() - new Date(revokedToken.updatedAt).getTime();
            const GRACE_PERIOD_MS = 15000; // 15 seconds

            if (timeSinceRevocation <= GRACE_PERIOD_MS) {
                // Allow the request to proceed and generate a new token
                tokenDoc = revokedToken;
            } else {
                // AUTOMATIC REUSE DETECTION: A revoked token was used again outside the grace period!
                // Revoke the entire family to protect the user's session.
                await RefreshToken.updateMany(
                    { familyId: revokedToken.familyId },
                    { $set: { isRevoked: true } }
                );
                
                const isProd = process.env.NODE_ENV === "production";
                const cookieOptions = {
                    httpOnly: true,
                    secure: isProd,
                    sameSite: isProd ? "none" : "strict",
                } as const;
                res.clearCookie("refreshToken", cookieOptions);
                res.status(401);
                throw new Error("Compromised token detected. All sessions revoked. Please login again.");
            }
        } else {
            const isProd = process.env.NODE_ENV === "production";
            const cookieOptions = {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? "none" : "strict",
            } as const;
            res.clearCookie("refreshToken", cookieOptions);
            res.status(401);
            throw new Error("Invalid refresh token");
        }
    }

    // Check expiration manually
    if (new Date() > tokenDoc.expiresAt) {
        const isProd = process.env.NODE_ENV === "production";
        const cookieOptions = {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "strict",
        } as const;
        res.clearCookie("refreshToken", cookieOptions);
        res.status(401);
        throw new Error("Refresh token expired");
    }

    // Valid token -> Token Rotation
    // Note: We ALREADY marked the old token as revoked in the atomic findOneAndUpdate!
    // Do NOT delete it, so we can detect reuse if an attacker tries to use it.

    // 2. Generate new tokens (REUSING the same familyId)
    const accessToken = generateAccessToken(tokenDoc.userId.toString());
    const { token: newRefreshTokenStr, familyId } = generateRefreshToken(tokenDoc.familyId);

    // 3. Save new refresh token (keeping same familyId)
    await createRefreshTokenRecord(tokenDoc.userId.toString(), newRefreshTokenStr, familyId);
    
    // 4. Set new cookie and return new access token
    setRefreshTokenCookie(res, newRefreshTokenStr);

    res.status(200).json({
        success: true,
        accessToken,
    });
});

export {
    loginUserController,
    initiateRegistrationController,
    verifyRegistrationController,
    logoutUserController,
    getCurrentUserProfileController,
    refreshTokenController,
};