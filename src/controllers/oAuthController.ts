import { NextFunction, Request, Response } from "express";
import prisma from "../db/db";
import config from "../config/config";

class OAuthController {
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

        // get the the providers client id, and other stuff needed for login
        const clientId = providerConfig?.clientId;
        const redirectUri = providerConfig?.redirectUri;

        // pass the vars to provider url 

    }
}