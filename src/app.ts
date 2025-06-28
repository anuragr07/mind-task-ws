// Description: This code sets up a basic Express server with CORS and body parsing middleware.
import express from "express";
import cors from 'cors';

// Initialize Express app
const app = express();

//  Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export default app;