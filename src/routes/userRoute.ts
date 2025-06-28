import { Router } from "express";
import { createUser } from "../controllers/userController";

const userRouter = Router();
userRouter.post("/create-user", createUser);

export default userRouter;