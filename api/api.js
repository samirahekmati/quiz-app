import { Router } from "express";

import authRouter from "./auth/authRouter.js";
import messageRouter from "./messages/messageRouter.js";


const api = Router();

api.use("/message", messageRouter);
api.use("/auth", authRouter)


export default api;
