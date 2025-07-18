// Description: This code sets up a basic Express server with CORS and body parsing middleware.
import express from "express";
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Initialize Express app
const app = express();

//  Middleware setup
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

export default app;