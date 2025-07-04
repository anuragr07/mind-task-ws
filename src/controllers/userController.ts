import prisma from '../db/db';

import { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../utils/exceptions/notFoundError";
import { getHashedPassword } from '../middlewares/authMiddleware';

interface IUser {
    id: string;
    name: string;
    email: string;
    password?: string;
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

        // TODO: If no url exists for Avatar, add random avatar url (check if this is needed on client side or server side)

        // Hash your password
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