import { Request, Response, NextFunction } from "express";
import prisma from "../db/db";
import config from "../config/config";
import { sign } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { ClientError } from "../utils/exceptions/clientError";
import { NotFoundError } from "../utils/exceptions/notFoundError";
import { UnauthorizedError } from "../utils/exceptions/unauthorizedError";
import { CustomError } from "../utils/exceptions/customError";
import { authenticateToken, getHashedPassword } from "../middlewares/authMiddleware";

class AuthController {

    // Login method
    static login = async (req: Request, res: Response, next: NextFunction) => {

        // Get email and pasword from body
        const { email, password } = req.body;
        if (!(email && password)) throw new ClientError('Email and passsword are required');

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { email: email } });
        if (!user) throw new NotFoundError('Email is not associated with any account.');

        // Check if password is valid
        const passwordValidFlag = await bcrypt.compareSync(password, user.password);
        if (!passwordValidFlag) throw new UnauthorizedError("Email and Password do not match");

        // Generate and sign a JWT token
        const accessToken = sign
        (
            {
                userId: user.id,
                userEmail: user.email
            },
            config.jwt.secret!,
            {
                expiresIn: '15m',
                algorithm: 'HS256',
                audience: config.jwt.audience,
                issuer: config.jwt.issuer,
            }
        )

        // Generate referesh token
        const refreshToken = sign
        (
            { userId: user.id },
            config.jwt.refreshSecret!,
            {
                expiresIn: '30d',
                algorithm: 'HS256',
                audience: config.jwt.audience,
                issuer: config.jwt.issuer,
            }
        )

        if(!(accessToken && refreshToken)) throw new CustomError("Server error. Error Signing in");

        // Assign this refresh token to HTTPOnly cookie
        if (!config.refreshToken) {
            throw new CustomError("Internal server error. Please log in again");
        }
        res.cookie(config.refreshToken, refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        // store this token in DB for validation and rotation
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                expiresAt: expiresAt,
            }
        })
        
        res.status(200).json({accessToken: accessToken});
    }

    // Change password function
    static changePassword = async (req: Request, res: Response, next: NextFunction) => {

        // TODO: We can add this recuring code in authMiddleware 
        // TODO: Check authorization here from authMiddleware
        // id, email, oldPassword, newPassword from req.body

        // Check if token exists in auth header
        const authHeader = req.headers['authorization'];
        if(!authHeader) throw new UnauthorizedError('No token found');
        const decoded = authenticateToken(authHeader);

        // Check if the inputs are received
        const { oldPassword, newPassword } = req.body;
        if (!(oldPassword && newPassword)) throw new ClientError("Please provide missing inputs.");

        // Check if userId and userEmail are inside decoded
        let userId: string | undefined;
        let userEmail: string | undefined;

        if (typeof decoded === "object" && decoded !== null && "userId" in decoded && "userEmail" in decoded) {
            userId = (decoded as any).userId;
            userEmail = (decoded as any).userEmail;
        } else {
            throw new UnauthorizedError("Invalid token.");
        }

        // check if user exist
        const user = await prisma.user.findUnique({
            where: { email: userEmail}
        })

        if(!user) throw new NotFoundError("No account exists with the provided email.");

        // if correct make hash of new password
        const passwordValidFlag = await bcrypt.compare(oldPassword, user.password);
        if(!passwordValidFlag) throw new UnauthorizedError("Email and password do not match");

        const newPasswordHash = getHashedPassword(newPassword);

        // change password using patch request
        const response = await prisma.user.update({
            where: { email: userEmail },
            data: { password: newPasswordHash}
        })

        res.status(200).json(response);
    }
}

export default AuthController;