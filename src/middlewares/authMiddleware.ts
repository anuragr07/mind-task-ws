import bcrypt from 'bcrypt'
import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../utils/exceptions/unauthorizedError';
import { sign, verify } from 'jsonwebtoken';
import config from '../config/config';
import { ForbiddenError } from '../utils/exceptions/forbiddenError';
import prisma from '../db/db';

// TODO: Add function for authorization checking
export function authenticateToken(authHeader: string) {
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) throw new UnauthorizedError("Please sign in to access.");
    if (!config.jwt.secret) throw new Error("JWT Config not defined in Configuration.")

    const decoded = verify(token, config.jwt.secret, {
        algorithms: ['HS256'],
        audience: config.jwt.audience,
        issuer: config.jwt.issuer,
    })

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

