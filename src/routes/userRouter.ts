import { Router } from "express";
import UserController from "../controllers/userController";
import { asyncHandler } from "../middlewares/asyncHandler";

const userRouter = Router();
userRouter.post("/create-user", asyncHandler(UserController.createUser));
userRouter.get("/:id", asyncHandler(UserController.getUserById));
userRouter.get("/", asyncHandler(UserController.getUsers));;

export default userRouter;