import prisma from '../db/db';
import bcrypt from 'bcrypt';

import { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../utils/exceptions/notFoundError";
import { CustomError } from "../utils/exceptions/customError";
import { getHashedPassword } from '../middlewares/authMiddleware';

interface IUser {
    id: string;
    name: string;
    email: string;
    password?: string;
}

const generateSafeCopy = (user: IUser): IUser => {
    let _user = { ...user };
    delete _user.password;
    return _user;
}

class UserController {
    constructor() { }

    // PROTECTTED ROUTE
    // Get all users (Probably wont be needed)
    static getUsers = async (req: Request, res: Response, next:NextFunction) => {
        const users = await prisma.user.findMany();

        if(!users) throw new NotFoundError("No users found");

        res.status(200).json(users);
    }

    // Get user function
    static getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // try {
            const user = await prisma.user.findUnique({
                where: { id: req.params.id }
            });

            if (!user) throw new NotFoundError("User not found. Wrong ID.");

            const safeUser = generateSafeCopy(user as IUser);
            res.status(200).json(safeUser);
        // } catch (error) {
        //     if (error instanceof NotFoundError) return next(error);
        //     else return next(new CustomError("An unknown error occurred."));
        // }
    }

    // Get user by email id
    static getUserByEmail = async (req: Request, res: Response, next: NextFunction) => {
        const user = await prisma.user.findUnique({
            where: { email: req.body.email }
        })

        if(!user) throw new NotFoundError("No user found with this email.");

        const safeUser = generateSafeCopy(user as IUser);
        res.status(200).json(safeUser);
    }

    // Create user function
    static createUser = async (req: Request, res: Response, next: NextFunction) => {

        // Deconstruct body
        // try {
            const { name, email, password } = req.body;

            // check if user exists with the email
            if(await prisma.user.findUnique({ where: { email: email }})) return res.status(409).json({message: "Email is already registered"});

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
        // } catch (error) {
        //     console.log(`Error while creating user: - \n${error}`);
        //     res.status(500).json({ error: "Internal server error" })
        // }


        /**
         * EDIT USER FUNCTION HERE
         */

        /**
         * DELETE USER FUNCTION HERE
         */
        
    }
}

export default UserController;