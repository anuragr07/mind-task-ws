import { NextFunction, Request, Response } from "express";
import prisma from "../db/db";
import config from "../config/config";
import { NotFoundError } from "../utils/exceptions/notFoundError";
import { ClientError } from "../utils/exceptions/clientError";
import { getGoogleTokens, getGoogleUserInfo } from "../middlewares/oAuthMiddleware";
import { CustomError } from "../utils/exceptions/customError";
import { issueTokens } from "../middlewares/authMiddleware";

class OAuthController {

    // Login or sign in with google/github
    static login = async (req: Request, res: Response, next: NextFunction) => {

        // check if any previous refresh token exist
        const cookies = req.cookies;

        // clear and delete the refresh token
        if (cookies?.refresh_token) await prisma.refreshToken.delete({ where: { token: cookies.refresh_token } });
        if (cookies?.refresh_token) res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'strict', secure: true });

        // check the provider and get the provider config
        const { provider } = req.params;
        let providerConfig;
        if (provider === 'google') providerConfig = config.google;
        else if (provider === 'github') providerConfig = config.github
        else throw new NotFoundError('provider not found');

        console.log(providerConfig);

        // get the the providers client id, and other stuff needed for login
        const clientId = providerConfig?.clientId as string;
        const redirectUri = providerConfig?.redirectUri as string;

        // pass the vars to provider url
        const oAuthUrl = providerConfig?.authUrl as string + new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: [
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
            ].join(' '),
            access_type: 'offline', // For refresh tokens
            prompt: 'consent',
        })

        // redirect to google auth
        res.redirect(oAuthUrl);
    }

    static handleGoogleCallback = async (req: Request, res: Response, next: NextFunction) => {
        const code = req.query.code as string;

        if (!code) new ClientError('No code received');

        // Get access and refresh token from google
        const response = await getGoogleTokens(code as string);
        const data = response.data;
        const googleAccessToken = data.access_token;
        const googleRefreshToken = data.refresh_token;
        const googleExpiresIn = data.expres_in;

        // check if old refresh token exists in cookie
        const oldRefreshToken = req.cookies?.refresh_token;
        if (oldRefreshToken) {
            const oldTokenResult = await prisma.refreshToken.findUnique({ where: { token: oldRefreshToken } });
            if (oldTokenResult) await prisma.refreshToken.delete({ where: { token: oldRefreshToken } });
            res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'strict', secure: true });
        }

        // get the userinfo from google
        const userInfo = await getGoogleUserInfo(googleAccessToken);
        if (!userInfo) throw new NotFoundError("Cannot get user info. Login again.");

        /*
        {
            "id": "112345678901234567890",
            "email": "john.doe@gmail.com",
            "verified_email": true,
            "name": "John Doe",
            "given_name": "John",
            "family_name": "Doe",
            "picture": "https://lh3.googleusercontent.com/a-/AOh14Gh9...",
            "locale": "en"
        }
        */
        // check if user exists then get info
        let user = await prisma.user.findUnique({ where: { email: userInfo.email as string } });

        // if user does not exists create new
        if (!user) {
            // create user
            user = await prisma.user.create({
                data: {
                    email: userInfo.email,
                    name: userInfo.name,
                    avatarUrl: userInfo.picture,
                }
            })

            if (!user) throw new CustomError("Error creating user. Try again.");

            // create oauthaccounts
            const resultOAuthAccounts = await prisma.oAuthAccount.create({
                data: {
                    provider: "google",
                    providerAccountId: userInfo.id,
                    userId: user.id,
                    expiresAt: new Date() + googleExpiresIn,
                }
            })

            if (!resultOAuthAccounts) {
                await prisma.user.delete({ where: { email: userInfo.email } });
                throw new CustomError("Error creating OAuth Account for user. Try again.");
            }
        }

        // issue jwt access and refresh token
        const { accessToken, newRefreshToken } = issueTokens(user.id, user.email);
        if (!accessToken || !newRefreshToken) throw new CustomError("Unable to create access tokens.");

        // store refresh token in db
        const refereshTokenResult = await prisma.refreshToken.create({
            data: {
                token: newRefreshToken,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                userId: user.id,
            }
        });

        // store refresh token in http only token
        res.cookie(config.refreshToken as string, newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        // send response containing the access token
        res.status(200).json({ accessToken: accessToken });
    }
}

export default OAuthController;