import { Router } from "express";
import AuthController from "../controllers/authController";
import { asyncHandler } from "../middlewares/asyncHandler";
import RefreshTokenController from "../controllers/refreshTokenController";
import OAuthController from "../controllers/oAuthController";
import { authenticateToken } from "../middlewares/authMiddleware";

const authRouter = Router();

// TODO: Forget password route
authRouter.post('/login', asyncHandler(AuthController.login));
authRouter.post('/register', asyncHandler(AuthController.register));
authRouter.post('/change-password', asyncHandler(AuthController.changePassword));
authRouter.post('/refresh', asyncHandler(RefreshTokenController.handleRefresh));
authRouter.post('/logout', asyncHandler(AuthController.logout));
authRouter.get('/:provider', asyncHandler(OAuthController.login));
authRouter.get('/google/callback', asyncHandler(OAuthController.handleGoogleCallback));

// The way to add a protected route
// authRouter.get('/profile', AuthController.authenticateRequest, asyncHandler(AuthController.profile));
export default authRouter;