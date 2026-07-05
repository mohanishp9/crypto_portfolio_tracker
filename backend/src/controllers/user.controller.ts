import { Request, Response } from "express";
import User from "../models/User.model";
import Transaction from "../models/Transaction.model";
import WatchlistItem from "../models/WatchlistItem.model";
import PriceAlert from "../models/PriceAlert.model";
import PortfolioSnapshot from "../models/PortfolioSnapshot.model";
import RefreshToken from "../models/RefreshToken.model";
import { redis } from "../config/redis";
import {
    updateNameSchema,
    initiateEmailChangeSchema,
    changePasswordSchema,
    initiateAccountDeletionSchema,
    verifyActionOtpSchema,
} from "../utils/validation";
import { sendTransactionalEmail } from "../services/email.service";
import { asyncHandler } from "../utils/asyncHandler";

// Utility for throwing async errors inside asyncHandler
const throwError = (res: Response, status: number, message: string) => {
    res.status(status);
    throw new Error(message);
};

// ---------------------------------------------------------
// CHECK NAME AVAILABILITY
// GET /api/users/me/check-name?name=xyz
// ---------------------------------------------------------
export const checkNameController = asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.query;
    if (!name || typeof name !== 'string') {
        res.status(400).json({ available: false, message: "Name query parameter is required" });
        return;
    }

    // Check exact name without lowercase if it's display name, but user wanted uniqueness. Let's assume unique case-insensitive or not. Wait, MongoDB name isn't lowercase by default. We'll use case-insensitive query.
    const userExists = await User.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    res.status(200).json({ available: !userExists });
});

// ---------------------------------------------------------
// UPDATE NAME
// PUT /api/users/me/name
// ---------------------------------------------------------
export const updateNameController = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = updateNameSchema.safeParse(req.body);
    if (!validatedData.success) {
        res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: validatedData.error.flatten().fieldErrors,
        });
        return;
    }

    const { name } = validatedData.data;

    if (!req.user || !req.user._id) {
        return throwError(res, 401, "Not authorized");
    }

    const existingUser = await User.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existingUser && existingUser._id?.toString() !== req.user._id.toString()) {
        res.status(409).json({ success: false, message: "Name is already taken." });
        return;
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { name: name.trim() },
        { new: true }
    ).select("-password");

    if (!updatedUser) {
        return throwError(res, 404, "User not found");
    }

    res.status(200).json({ success: true, user: updatedUser });
});

// ---------------------------------------------------------
// CHANGE PASSWORD
// PUT /api/users/me/password
// ---------------------------------------------------------
export const changePasswordController = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = changePasswordSchema.safeParse(req.body);
    if (!validatedData.success) {
        res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: validatedData.error.flatten().fieldErrors,
        });
        return;
    }

    const { currentPassword, newPassword } = validatedData.data;

    if (!req.user || !req.user._id) {
        return throwError(res, 401, "Not authorized");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        return throwError(res, 404, "User not found");
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        res.status(401).json({ success: false, message: "Invalid current password" });
        return;
    }

    // Assign new password, pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    // Invalidate all other refresh tokens for security
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        await RefreshToken.deleteMany({ userId: user._id.toString(), tokenHash: { $ne: refreshToken } }); // Just wipe all to be safe, tokenHash logic is slightly different
        await RefreshToken.deleteMany({ userId: user._id.toString() }); // Let's just revoke all sessions
    } else {
        await RefreshToken.deleteMany({ userId: user._id.toString() });
    }

    res.status(200).json({ success: true, message: "Password updated successfully. Please log in again." });
});

// ---------------------------------------------------------
// INITIATE EMAIL CHANGE
// POST /api/users/me/email/initiate
// ---------------------------------------------------------
export const initiateEmailChangeController = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = initiateEmailChangeSchema.safeParse(req.body);
    if (!validatedData.success) {
        res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: validatedData.error.flatten().fieldErrors,
        });
        return;
    }

    const { currentPassword, newEmail } = validatedData.data;

    if (!req.user || !req.user._id) {
        return throwError(res, 401, "Not authorized");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        return throwError(res, 404, "User not found");
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        res.status(401).json({ success: false, message: "Invalid current password" });
        return;
    }

    const existingUserWithEmail = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUserWithEmail) {
        res.status(409).json({ success: false, message: "Email is already in use by another account." });
        return;
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const redisKey = `email_change:otp:${req.user._id}`;
    if (!redis) {
        return throwError(res, 500, "Redis is not connected.");
    }

    const payload = JSON.stringify({
        newEmail: newEmail.toLowerCase(),
        otp,
        attempts: 3
    });

    await redis.set(redisKey, payload, 'EX', 600); // 10 minutes

    if (process.env.NODE_ENV === "development") {
        console.log(`[Development OTP] Email Update OTP for ${newEmail}: ${otp}`);
    }

    // Send Email to NEW email
    const emailSent = await sendTransactionalEmail({
        to: newEmail,
        recipientName: user.name,
        subject: "Verify Your New Email Address - CypherSight",
        htmlContent: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; background-color: #09090b; color: #fafafa; padding: 32px; border-radius: 16px; border: 1px solid #27272a;">
                <h1 style="color: #10b981; font-size: 24px; margin-bottom: 8px;">CypherSight</h1>
                <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 24px; letter-spacing: 0.05em; text-transform: uppercase;">Security Notice</p>
                
                <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Verify your new email</h2>
                <p style="color: #d4d4d8; line-height: 1.6; margin-bottom: 24px;">
                    You recently requested to change your CypherSight account email to this address. Use the verification code below to confirm this change.
                </p>
                
                <div style="background-color: #18181b; border: 1px solid #3f3f46; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <span style="font-family: monospace; font-size: 32px; letter-spacing: 0.25em; color: #fafafa;">${otp}</span>
                </div>
                
                <p style="color: #a1a1aa; font-size: 12px; line-height: 1.5; margin-bottom: 8px;">
                    This code will expire in 10 minutes.
                </p>
                <p style="color: #a1a1aa; font-size: 12px; line-height: 1.5;">
                    If you did not request this change, you can safely ignore this email.
                </p>
            </div>
        `
    });

    if (!emailSent) {
        await redis.del(redisKey);
        res.status(500);
        throw new Error("Failed to send verification email. Please try again later.");
    }

    res.status(200).json({ success: true, message: "Verification OTP sent to your new email." });
});

// ---------------------------------------------------------
// VERIFY EMAIL CHANGE
// PUT /api/users/me/email/verify
// ---------------------------------------------------------
export const verifyEmailChangeController = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = verifyActionOtpSchema.safeParse(req.body);
    if (!validatedData.success) {
        res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: validatedData.error.flatten().fieldErrors,
        });
        return;
    }

    const { otp } = validatedData.data;

    if (!req.user || !req.user._id) {
        return throwError(res, 401, "Not authorized");
    }

    if (!redis) {
        return throwError(res, 500, "Redis is not connected.");
    }

    const redisKey = `email_change:otp:${req.user._id}`;
    
    // OPTIMISTIC LOCKING
    await redis.watch(redisKey);
    const dataStr = await redis.get(redisKey);

    if (!dataStr) {
        await redis.unwatch();
        res.status(400).json({ success: false, message: "OTP expired or invalid." });
        return;
    }

    const data = JSON.parse(dataStr);

    if (data.otp !== otp) {
        const remainingAttempts = data.attempts - 1;
        if (remainingAttempts <= 0) {
            const multi = redis.multi();
            multi.del(redisKey);
            await multi.exec();
            res.status(400).json({ success: false, message: "Too many failed attempts. OTP invalidated." });
            return;
        } else {
            data.attempts = remainingAttempts;
            const multi = redis.multi();
            multi.set(redisKey, JSON.stringify(data), 'KEEPTTL');
            const execResult = await multi.exec();

            if (!execResult) {
                res.status(409).json({ success: false, message: "Conflict occurred. Please try again." });
                return;
            }
            res.status(400).json({ success: false, message: `Invalid OTP. ${remainingAttempts} attempts remaining.` });
            return;
        }
    }

    // Success - delete key and update user
    const multi = redis.multi();
    multi.del(redisKey);
    const execResult = await multi.exec();

    if (!execResult) {
        res.status(409).json({ success: false, message: "Conflict occurred. Please try again." });
        return;
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { email: data.newEmail },
        { new: true }
    ).select("-password");

    if (!updatedUser) {
        return throwError(res, 404, "User not found");
    }

    res.status(200).json({ success: true, message: "Email updated successfully.", user: updatedUser });
});

// ---------------------------------------------------------
// INITIATE ACCOUNT DELETION
// POST /api/users/me/delete/initiate
// ---------------------------------------------------------
export const initiateAccountDeletionController = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = initiateAccountDeletionSchema.safeParse(req.body);
    if (!validatedData.success) {
        res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: validatedData.error.flatten().fieldErrors,
        });
        return;
    }

    const { currentPassword } = validatedData.data;

    if (!req.user || !req.user._id) {
        return throwError(res, 401, "Not authorized");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        return throwError(res, 404, "User not found");
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        res.status(401).json({ success: false, message: "Invalid current password" });
        return;
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const redisKey = `delete:otp:${req.user._id}`;
    if (!redis) {
        return throwError(res, 500, "Redis is not connected.");
    }

    const payload = JSON.stringify({
        otp,
        attempts: 3
    });

    await redis.set(redisKey, payload, 'EX', 600); // 10 minutes

    if (process.env.NODE_ENV === "development") {
        console.log(`[Development OTP] Account Deletion OTP for ${user.email}: ${otp}`);
    }

    // Send Email to CURRENT email
    const emailSent = await sendTransactionalEmail({
        to: user.email,
        recipientName: user.name,
        subject: "Confirm Account Deletion - CypherSight",
        htmlContent: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; background-color: #09090b; color: #fafafa; padding: 32px; border-radius: 16px; border: 1px solid #27272a;">
                <h1 style="color: #ef4444; font-size: 24px; margin-bottom: 8px;">CypherSight</h1>
                <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 24px; letter-spacing: 0.05em; text-transform: uppercase;">Action Required</p>
                
                <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Confirm Account Deletion</h2>
                <p style="color: #d4d4d8; line-height: 1.6; margin-bottom: 24px;">
                    We received a request to permanently delete your CypherSight account. This action cannot be undone and all your portfolio data will be lost. Use the verification code below to confirm this action.
                </p>
                
                <div style="background-color: #18181b; border: 1px solid #ef4444; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <span style="font-family: monospace; font-size: 32px; letter-spacing: 0.25em; color: #ef4444;">${otp}</span>
                </div>
                
                <p style="color: #a1a1aa; font-size: 12px; line-height: 1.5; margin-bottom: 8px;">
                    This code will expire in 10 minutes.
                </p>
                <p style="color: #a1a1aa; font-size: 12px; line-height: 1.5;">
                    If you did not request to delete your account, change your password immediately.
                </p>
            </div>
        `
    });

    if (!emailSent) {
        await redis.del(redisKey);
        res.status(500);
        throw new Error("Failed to send verification email. Please try again later.");
    }

    res.status(200).json({ success: true, message: "Verification OTP sent to your email." });
});

// ---------------------------------------------------------
// VERIFY ACCOUNT DELETION
// DELETE /api/users/me
// ---------------------------------------------------------
export const deleteAccountController = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = verifyActionOtpSchema.safeParse(req.body);
    if (!validatedData.success) {
        res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: validatedData.error.flatten().fieldErrors,
        });
        return;
    }

    const { otp } = validatedData.data;

    if (!req.user || !req.user._id) {
        return throwError(res, 401, "Not authorized");
    }

    if (!redis) {
        return throwError(res, 500, "Redis is not connected.");
    }

    const redisKey = `delete:otp:${req.user._id}`;
    
    // OPTIMISTIC LOCKING
    await redis.watch(redisKey);
    const dataStr = await redis.get(redisKey);

    if (!dataStr) {
        await redis.unwatch();
        res.status(400).json({ success: false, message: "OTP expired or invalid." });
        return;
    }

    const data = JSON.parse(dataStr);

    if (data.otp !== otp) {
        const remainingAttempts = data.attempts - 1;
        if (remainingAttempts <= 0) {
            const multi = redis.multi();
            multi.del(redisKey);
            await multi.exec();
            res.status(400).json({ success: false, message: "Too many failed attempts. OTP invalidated." });
            return;
        } else {
            data.attempts = remainingAttempts;
            const multi = redis.multi();
            multi.set(redisKey, JSON.stringify(data), 'KEEPTTL');
            const execResult = await multi.exec();

            if (!execResult) {
                res.status(409).json({ success: false, message: "Conflict occurred. Please try again." });
                return;
            }
            res.status(400).json({ success: false, message: `Invalid OTP. ${remainingAttempts} attempts remaining.` });
            return;
        }
    }

    // Success - cascade delete
    const multi = redis.multi();
    multi.del(redisKey);
    const execResult = await multi.exec();

    if (!execResult) {
        res.status(409).json({ success: false, message: "Conflict occurred. Please try again." });
        return;
    }

    // Proceed with cascade deletion
    const userIdString = req.user._id.toString();

    // 1. Delete user's portfolios (transactions)
    await Transaction.deleteMany({ userId: userIdString });
    
    // 2. Delete user's watchlists
    await WatchlistItem.deleteMany({ userId: userIdString });

    // 3. Delete user's price alerts
    await PriceAlert.deleteMany({ userId: userIdString });

    // 4. Delete user's portfolio snapshots
    await PortfolioSnapshot.deleteMany({ userId: userIdString });

    // 5. Delete user's refresh tokens
    await RefreshToken.deleteMany({ userId: userIdString });

    // 6. Delete user
    await User.findByIdAndDelete(req.user._id);

    // 7. Clear cookie
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    res.status(200).json({ success: true, message: "Account deleted successfully." });
});
