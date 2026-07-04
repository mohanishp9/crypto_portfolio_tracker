import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().min(2, { message: "Name must have at least 2 characters" }).max(50, { message: "Name must have at most 50 characters " }),
    email: z.string().email({ message: "Invalid email" }),
    password: z.string().min(6, { message: "Password must have at least 6 characters" }).max(100, { message: "Password must have at most 100 characters" }),
});

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email" }),
    password: z.string().min(6, { message: "Password must have at least 6 characters" }),
});

export const verifyOtpSchema = z.object({
    email: z.string().email({ message: "Invalid email" }),
    otp: z.string().length(6, { message: "OTP must be exactly 6 digits" }),
});

export const updateNameSchema = z.object({
    name: z.string().min(2, { message: "Name must have at least 2 characters" }).max(50, { message: "Name must have at most 50 characters " }),
});

export const initiateEmailChangeSchema = z.object({
    currentPassword: z.string().min(6),
    newEmail: z.string().email({ message: "Invalid email" }),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6).max(100),
});

export const initiateAccountDeletionSchema = z.object({
    currentPassword: z.string().min(6),
});

export const verifyActionOtpSchema = z.object({
    otp: z.string().length(6, { message: "OTP must be exactly 6 digits" }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;