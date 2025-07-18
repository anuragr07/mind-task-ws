import prisma from '../db/db';

import { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../utils/exceptions/notFoundError";
import { getHashedPassword } from '../middlewares/authMiddleware';
import config from '../config/config';
import { sign } from 'jsonwebtoken';

interface IUser {
    id: string;
    name: string;
    email: string;
    password?: string | null;
}

export const generateSafeUserCopy = (user: IUser): IUser => {
    let _user = { ...user };
    delete _user.password;
    return _user;
}

class UserController {
    constructor() { }

    // PROTECTTED ROUTE
    // Get all users (Probably wont be needed)
    static getUsers = async (req: Request, res: Response, next: NextFunction) => {
        const users = await prisma.user.findMany();

        if (!users) throw new NotFoundError("No users found");

        res.status(200).json(users);
    }

    // Get user function
    static getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        
        const user = await prisma.user.findUnique({
            where: { id: req.params.id }
        });

        if (!user) throw new NotFoundError("User not found. Wrong ID.");

        const safeUser = generateSafeUserCopy(user as IUser);
        res.status(200).json(safeUser);
    }

    // Get user by email id
    static getUserByEmail = async (req: Request, res: Response, next: NextFunction) => {
        const user = await prisma.user.findUnique({
            where: { email: req.body.email }
        })

        if (!user) throw new NotFoundError("No user found with this email.");

        const safeUser = generateSafeUserCopy(user as IUser);
        res.status(200).json(safeUser);
    }

    // Create user function
    static createUser = async (req: Request, res: Response, next: NextFunction) => {

        // Deconstruct body
        const { name, email, password } = req.body;

        // check if user exists with the email
        if (await prisma.user.findUnique({ where: { email: email } })) return res.status(409).json({ message: "Email is already registered" });

        // create hashed password
        const passwordHash = getHashedPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: passwordHash
            }
        });

        // TODO: add user login here
        // Generate and sign a JWT token
        const accessToken = sign(
            {
                userId: user.id,
                userEmail: user.email
            },
            config.jwt.secret!,
            {
                expiresIn: '15s',
                algorithm: 'HS256',
                audience: config.jwt.audience,
                issuer: config.jwt.issuer,
            }
        )

        // Generate referesh token
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

        // Send JWT token, refresh token
        // Set httponly cookie with the token

        res.status(201).json(user);

        /**
         * EDIT USER FUNCTION HERE
         */

        /**
         * DELETE USER FUNCTION HERE
         */

    }
}

export default UserController;