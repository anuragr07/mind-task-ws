import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

import { Request, Response } from "express";

// Define the request body type for creating a user
interface CreateUserRequestBody {
    name: string;
    email: string;
    password: string;
}

async function createUser (
    req: Request<unknown, unknown, CreateUserRequestBody>,
    res: Response
): Promise<void> {
    try {
        const { name, email, password } = req.body;

        // Define salt rounds for hashing
        const saltRounds = 10;

        // Create hashed password
        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(password, salt);
        
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashPassword
            }
        });

        res.status(201).json(user);
    } catch (error) {
        // console.error("Error creating user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export { createUser };