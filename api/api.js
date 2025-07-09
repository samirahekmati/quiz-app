import { Router } from "express";

import messageRouter from "./messages/messageRouter.js";
import authRouter from "./auth/authRouter.js";

const api = Router();

api.use("/message", messageRouter);
api.use("/auth", authRouter)


export default api;
