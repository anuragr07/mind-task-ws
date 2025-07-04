import { NextFunction, Request, Response } from "express";
import { sign, verify } from "jsonwebtoken";
import { UnauthorizedError } from "../utils/exceptions/unauthorizedError";
import prisma from "../db/db";
import { ForbiddenError } from "../utils/exceptions/forbiddenError";
import config from "../config/config";
import { CustomError } from "../utils/exceptions/customError";

class RefreshTokenController {
    static handleRefreshToken = async (req: Request, res: Response, next: NextFunction) => {

        // Get the refresh token from the cookie
        const cookies = req.cookies;
        if (!cookies?.refresh_token) throw new UnauthorizedError('No cookies found in the request');
        const refreshToken = cookies.refresh_token;

        res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });

        // Check if the token exists in the database
        const foundToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken }
        })

        // Check refresh secret
        if (!config.jwt.refreshSecret) throw new CustomError("Internal Server Error")

        // Detected refresh token reuse
        if (!foundToken) {
            verify(
                refreshToken,
                config.jwt.refreshSecret,
                async (err: any, decoded: any) => {
                    if (err) throw new ForbiddenError('No such token found in store');

                    // Now its a reuse attempt
                    // Get user associated with the refresh token
                    const hackedUser = await prisma.user.findUnique({
                        where: { id: decoded.userId }
                    });
                    if (!hackedUser) throw new ForbiddenError('No user found associated with the token');

                    // Delete all refresh tokens from the db related to the user
                    const result = await prisma.refreshToken.deleteMany({
                        where: { userId: hackedUser.id }
                    });
                    console.log(result);
                }
            )

            // Throw forbidden error at the end
            throw new ForbiddenError('No such token found in store');
        }

        // Get user associated with the token
        const user = await prisma.user.findUnique({
            where: { id: foundToken.userId }
        })
        if (!user) throw new ForbiddenError('No user found associated with the token');

        // If token found and we have to issue new access and refresh token
        verify(
            refreshToken,
            config.jwt.refreshSecret,
            async (err: any, decoded: any) => {
                // Token expired
                if (err) {
                    // Delete the token from the db
                    await prisma.refreshToken.delete({
                        where: { token: refreshToken }
                    });
                }
                if (err || foundToken.userId !== decoded.userId) return new UnauthorizedError('Token invalid');

                if (!config.jwt.secret) {
                    console.error('No JWT access secret found');
                    throw new CustomError('Internal server error');
                }

                // Token is still valid
                // Generate and sign a JWT access token
                const accessToken = sign(
                    {
                        userId: user.id,
                        userEmail: user.email,
                    },
                    config.jwt.secret,
                    {
                        expiresIn: '30d',
                        algorithm: 'HS256',
                        audience: config.jwt.audience,
                        issuer: config.jwt.issuer,
                    }
                )

                // Generate new refresh token
                const newRefreshToken = sign(
                    { userId: user.id },
                    config.jwt.refreshSecret!,
                    {
                        expiresIn: '30d',
                        algorithm: 'HS256',
                        audience: config.jwt.audience,
                        issuer: config.jwt.issuer,
                    }
                )

                if (!(accessToken && newRefreshToken)) throw new CustomError("Server error. Error Signing in");

                // Assign this refresh token to HTTPOnly cookie
                if (!config.refreshToken) {
                    throw new CustomError("Internal server error. Please log in again");
                }
                res.cookie(config.refreshToken, newRefreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict',
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                });

                // store this token in DB for validation and rotation
                const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                await prisma.$transaction([
                    prisma.refreshToken.delete({
                        where: { token: refreshToken },
                    }),
                    prisma.refreshToken.create({
                        data: {
                            userId: user.id,
                            token: newRefreshToken,
                            expiresAt,
                        }
                    })
                ]);

                // send access token
                res.status(200).json({ accessToken: accessToken });
            }
        )
    }
}

export default RefreshTokenController;