import { NextFunction, Request, Response } from "express";
import prisma from "../db/db";
import config from "../config/config";
import { NotFoundError } from "../utils/exceptions/notFoundError";
import { ClientError } from "../utils/exceptions/clientError";
import { getGoogleTokens } from "../middlewares/oAuthMiddleware";

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
        const accessToken = data.access_token;
        const refreshToken = data.refresh_token;
        const expiresIn = data.expres_in;

        // check if old refresh token exists in cookie
        const oldRefreshToken = req.cookies?.refresh_token;
        if (refreshToken) {
            await prisma.refreshToken.delete({ where: { token: oldRefreshToken } })
            res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'strict', secure: true });
        }

        // 

    }
}

export default OAuthController; 87