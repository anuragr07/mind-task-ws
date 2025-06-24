// Description: This code sets up a basic Express server with CORS and body parsing middleware.
import express, { Application } from "express";
import cors from 'cors';
import bodyParser from 'body-parser';

// Load environment variables from .env.local file
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local'});

// Initialize Express app
const app: Application = express();

//  Middleware setup
app.use(cors());
app.use(bodyParser.json());

export default app;