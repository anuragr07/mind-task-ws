import { Router } from "express";
import AuthController from "../controllers/authController";
import { asyncHandler } from "../middlewares/asyncHandler";
import RefreshTokenController from "../controllers/refreshTokenController";

const authRouter = Router();

authRouter.post('/login', asyncHandler(AuthController.login));
authRouter.post('/change-password', asyncHandler(AuthController.changePassword));
authRouter.post('/refresh', asyncHandler(RefreshTokenController.handleRefreshToken));

export default authRouter;