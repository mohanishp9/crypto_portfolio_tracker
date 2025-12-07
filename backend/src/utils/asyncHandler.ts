import { Request, Response, NextFunction } from "express";

type AsyncFunction = (
    req: Request,
    res: Response,
    next: NextFunction,
) => Promise<any>

/**
 * Wraps an async route handler and forwards errors to Express error middleware.
 * Usage: router.get('/path', asyncHandler(handler));
 */
export const asyncHandler = (fn: AsyncFunction) => (
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    }
);