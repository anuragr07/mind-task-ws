// Dotenv configuration to load environment variables
import dotenv from 'dotenv';

try {
    const result = dotenv.config(); 
} catch (error) {
    console.log("Error while configuring dotenv.");
}

const config = {
    // JWT Environment Variables
    jwt: {
        secret: process.env.JWT_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
    },

    // DB Environment Variables
    db: {
        url: process.env.DB_URL,
        port: process.env.DB_PORT,
    },

    // Server Environment Variables
    server: {
        port: process.env.SERVER_PORT || 8000,
        prefix: process.env.API_PREFIX,
    }

    // Other Variables
}

export default config;