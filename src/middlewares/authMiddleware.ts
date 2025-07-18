import bcrypt from 'bcrypt'
import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../utils/exceptions/unauthorizedError';
import { sign, verify } from 'jsonwebtoken';
import config from '../config/config';
import { ForbiddenError } from '../utils/exceptions/forbiddenError';
import prisma from '../db/db';
import { ClientError } from '../utils/exceptions/clientError';
import AuthController from '../controllers/authController';
import RefreshTokenController from '../controllers/refreshTokenController';
import { CustomError } from '../utils/exceptions/customError';
import { generateSafeUserCopy } from '../controllers/userController';

// TODO: Add function for authorization checking
export function


    authenticateToken(authHeader: string) {
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) throw new UnauthorizedError("Please sign in to access.");
    if (!config.jwt.secret) throw new Error("JWT Config not defined in Configuration.")

    const decoded = verify(token, config.jwt.secret, {
        algorithms: ['HS256'],
        audience: config.jwt.audience,
        issuer: config.jwt.issuer,
    });
    return decoded;
}

export function getHashedPassword(password: string): string {
    // Define salt rounds for password hashing
    const saltRounds = 10;

    // Create hashed password
    const salt = bcrypt.genSaltSync(saltRounds);
    const passwordHash = bcrypt.hashSync(password, salt);

    return passwordHash;
}

export function invalidateRefreshToken(refreshToken: string) {
    verify(
        refreshToken,
        config.jwt.refreshSecret as string,
        async (err: any, decoded: any) => {
            if (err) throw new ForbiddenError('No such token found in store');
            console.log(`Attempted token reuse: ${refreshToken}`);

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
}

export function issueTokens(userId: string, userEmail: string) {
    const accessToken = sign(
        {
            userId: userId,
            userEmail: userEmail,
        },
        config.jwt.secret as string,
        {
            expiresIn: '30d',
            algorithm: 'HS256',
            audience: config.jwt.audience,
            issuer: config.jwt.issuer,
        }
    )

    const newRefreshToken = sign(
        { userId: userId },
        config.jwt.refreshSecret!,
        {
            expiresIn: '30d',
            algorithm: 'HS256',
            audience: config.jwt.audience,
            issuer: config.jwt.issuer,
        }
    )

    return {
        accessToken: accessToken,
        newRefreshToken: newRefreshToken,
    }
}

// export async function verifyUserLogin(req: Request, res: Response, next: NextFunction) {

//     // check if access_token exists in the request
//     // get the access token
//     // TODO: Get the access token from the frontend storage
//     let accessToken = req.body.token;
//     if (!accessToken) {
//         // if no access access token check if refresh token
//         // if refresh token call ./refresh function
//         // Get the refresh token from the cookie
//         const cookies = req.cookies;
//         if (!cookies?.refresh_token) throw new UnauthorizedError('No cookies found in the request');
//         const refreshToken = cookies.refresh_token;

//         // clear the cookie
//         res.clearCookie('refresh_token', {
//             httpOnly: true,
//             secure: true,
//             sameSite: 'strict',
//         });

//         // Get access_token and new refresh_token
//         const refreshResponse = await performTokenRefresh(refreshToken);
//         if (refreshResponse instanceof UnauthorizedError) throw refreshResponse;
//         if (!refreshResponse.refresh) throw new UnauthorizedError("Cannot refresh. Login again.");

//         if (refreshResponse.tokens === null) throw new CustomError("No tokens found or created. Server")
//         let { accessToken, newRefreshToken } = refreshResponse.tokens;

//         // Assign this refresh token to HTTPOnly cookie
//         res.cookie(config.refreshToken as string, newRefreshToken, {
//             httpOnly: true,
//             secure: true,
//             sameSite: 'strict',
//             maxAge: 30 * 24 * 60 * 60 * 1000,
//         });

//         accessToken = newAccessToken;
//     }
//     // get the user data from the decoded access token
//     verify(accessToken, config.jwt.secret as string, async (err: any, decoded: any) => {
//         if (err || !decoded) {
//             throw new UnauthorizedError("Token invalid. Sign in again");
//         }
//         // Check if user exists
//         const decodedUser = await prisma.user.findUnique({ where: { id: decoded.userId } })
//         if (!decodedUser) throw new ForbiddenError("User not found");

//         res.status(200).send(generateSafeUserCopy(decodedUser));
//     })
// }

export async function performTokenRefresh(refreshToken: string) {
    // Check if the token exists in the database
    const foundToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken }
    })


    // Detected refresh token reuse
    if (!foundToken) {
        invalidateRefreshToken(refreshToken);
        throw new ForbiddenError('No such token found in store');
    }

    // Get user associated with the token
    const user = await prisma.user.findUnique({
        where: { id: foundToken.userId }
    })
    if (!user) throw new ForbiddenError('No user found associated with the token');


    try {
        const decoded = verify(refreshToken, config.jwt.refreshSecret as string) as { userId: string, email: string };

        // Invalid token received
        if (!decoded) {
            console.log('Invalid refresh token received: ');
            const result = await prisma.refreshToken.delete({
                where: { token: refreshToken }
            });
            console.log(`Result on database save: ${result}`);
        }

        // If userid does not match any records in the refresh token
        if (foundToken.userId !== decoded.userId) return new UnauthorizedError('Token invalid');

        // Token is still valid
        // Generate and sign a JWT access token
        const { accessToken, newRefreshToken } = issueTokens(user.id, user.email);
        if (!(accessToken && newRefreshToken)) throw new CustomError("Server error. Error Signing in");

        // store this token in DB for validation and rotation
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        await prisma.refreshToken.delete({
            where: { token: refreshToken },
        });
        const createRefreshTokenResult = await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: newRefreshToken,
                expiresAt,
            }
        });

        // Return tokens
        return {
            refresh: true,
            tokens: { accessToken, newRefreshToken }
        }
    } catch (err: any) {
        console.log(`Error occured while refreshing the token: ${err}`);
        return {refresh: false, tokens: null}
    }
}

