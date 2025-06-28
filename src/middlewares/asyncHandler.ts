import { NextFunction, Request, Response } from 'express';

/**
 * Async Handler to wrap the API routes allowing for async error handling
 * @param fn Function to wrap API Endpoint
 * @returns Promisse with a catch statement
 */
export const asyncHandler = (fn: ( req: Request, res: Response, next: NextFunction ) => void) => {
    ( req: Request, res: Response, next: NextFunction ) => {
        return Promise.resolve(fn(req, res, next)).catch(next);
    }
}