import { Router } from "express";
import AuthController from "../controllers/authController";
import { asyncHandler } from "../middlewares/asyncHandler";

const authRouter = Router();

authRouter.post('/login', asyncHandler(AuthController.login));
authRouter.post('/change-password', asyncHandler(AuthController.changePassword));

export default authRouter;