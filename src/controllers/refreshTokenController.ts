import { NextFunction, Request, Response } from "express";
import { sign, verify } from "jsonwebtoken";
import { UnauthorizedError } from "../utils/exceptions/unauthorizedError";
import prisma from "../db/db";
import { ForbiddenError } from "../utils/exceptions/forbiddenError";
import config from "../config/config";
import { CustomError } from "../utils/exceptions/customError";
import { invalidateRefreshToken, issueTokens, performTokenRefresh } from "../middlewares/authMiddleware";

class RefreshTokenController {

    // TODO: rename to handleRefresh
    static handleRefresh = async (req: Request, res: Response, next: NextFunction) => {

        // Get the refresh token from the cookie
        const cookies = req.cookies;
        if (!cookies?.refresh_token) throw new UnauthorizedError('No cookies found in the request');
        const refreshToken = cookies.refresh_token;

        // clear the cookie
        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });

        // Get access_token and new refresh_token
        const refreshResponse = await performTokenRefresh(refreshToken);

        // Type guard to check for UnauthorizedError
        if (refreshResponse instanceof UnauthorizedError) {
            throw refreshResponse;
        }

        if (!refreshResponse.refresh) throw new UnauthorizedError("Cannot refresh. Login again.");

        if (refreshResponse.tokens === null) throw new CustomError("No tokens found or created. Server");
        const { accessToken, newRefreshToken } = refreshResponse.tokens;

        // Assign this refresh token to HTTPOnly cookie
        res.cookie(config.refreshToken as string, newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        // send access token
        res.status(200).json({ accessToken: accessToken });
    }        
}


export default RefreshTokenController;