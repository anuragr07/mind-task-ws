import  { Router } from 'express';
import userRouter from './userRouter';

const routes = Router();

// Add all the routers here
routes.use('/users', userRouter);
// routes.use('/auth', authRouter);

export default routes;
