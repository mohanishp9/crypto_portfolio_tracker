import { asyncHandler } from "../utils/asyncHandler";
import { registerSchema, RegisterInput, loginSchema, LoginInput } from "../utils/validation";
import User from "../models/User.model";
import { generateToken } from "../utils/jwt";
import { Request, Response } from "express";


// @desc Create a new user
// @route POST /register
// @access Public
const registerUserController = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = registerSchema.parse(req.body);

    const { name, email, password }: RegisterInput = validatedData;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(409);
        throw new Error("User already exists");
    }

    const user = await User.create({
        name,
        email,
        password,
    })

    if (user) {
        const jwtToken = generateToken(user._id.toString());
        res.cookie("token", jwtToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        res.status(201).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
            jwtToken,
        })
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
        const jwtToken = generateToken(user._id.toString());
        res.cookie("token", jwtToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
            jwtToken,
        })
    } else {
        res.status(401);
        throw new Error("Invalid credentials");
    }
})

// @desc Logout a user
// @route POST /logout
// @access Private
const logoutUserController = asyncHandler(async (_req: Request, res: Response) => {
    res.clearCookie("token");
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
    })
})

export {
    registerUserController,
    loginUserController,
    logoutUserController,
    getCurrentUserProfileController,
};