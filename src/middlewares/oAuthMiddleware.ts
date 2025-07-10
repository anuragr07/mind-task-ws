import config from "../config/config";
import axios from "axios";


// Make this dynamic if github and google has same standards for token or authorization code
export async function getGoogleTokens(code: string) {
    const url = config.google.tokenUrl as string;
    const values = {
        code,
        client_id: config.google.clientId as string,
        client_secret: config.google.clientSecret as string,
        redirect_uri: config.google.redirectUri as string,
        grant_type: 'authorization_code'
    };

    const response = await axios.post(url, values, {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    })

    return response.data;
}

export async function getGoogleUserInfo(accessToken: string) {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    return response.data;
}