import bcrypt from 'bcrypt'
import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../utils/exceptions/unauthorizedError';
import { verify } from 'jsonwebtoken';
import config from '../config/config';

// TODO: Add function for authorization checking
export function authenticateToken(authHeader: string) {
    const token = authHeader && authHeader.split(' ')[1];
    
    if(!token) throw new UnauthorizedError("Please sign in to access.");
    if(!config.jwt.secret) throw new Error("JWT Config not defined in Configuration.")

    const decoded = verify(token, config.jwt.secret, {
        algorithms: ['HS256'],
        audience: config.jwt.audience,
        issuer: config.jwt.issuer,
    })

    return decoded;
}


export function getHashedPassword (password: string): string {
    // Define salt rounds for password hashing
    const saltRounds = 10;

    // Create hashed password
    const salt = bcrypt.genSaltSync(saltRounds);
    const passwordHash = bcrypt.hashSync(password, salt);

    return passwordHash;
}



