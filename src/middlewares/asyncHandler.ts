import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async Express route handler and ensures any errors
 * are passed to the Express error-handling middleware via `next()`.
 * 
 * This avoids needing to use try/catch in every async route.
 *
 * @param handler - An async route function to wrap.
 * @returns A standard Express middleware function with error forwarding.
 */
export const asyncHandler = (handler: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Execute the handler and catch any errors, passing them to Express
        return Promise.resolve(handler(req, res, next)).catch(next);
    };
};

