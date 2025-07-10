import { Router } from "express";
import AuthController from "../controllers/authController";
import { asyncHandler } from "../middlewares/asyncHandler";
import RefreshTokenController from "../controllers/refreshTokenController";
import OAuthController from "../controllers/oAuthController";

const authRouter = Router();

// TODO: Register route
// TODO: Forget password route
authRouter.post('/login', asyncHandler(AuthController.login));
authRouter.post('/change-password', asyncHandler(AuthController.changePassword));
authRouter.post('/refresh', asyncHandler(RefreshTokenController.handleRefreshToken));
authRouter.post('/logout', asyncHandler(AuthController.logout));
authRouter.get('/:provider', asyncHandler(OAuthController.login));
authRouter.get('/google/callback', asyncHandler(OAuthController.handleGoogleCallback));

export default authRouter;