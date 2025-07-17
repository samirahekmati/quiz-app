import { Router } from "express";

import authRouter from "./auth/authRouter.js";
import messageRouter from "./messages/messageRouter.js";
import quizRouter from "./quiz/quizRouter.js";

const api = Router();

api.use("/message", messageRouter);
api.use("/auth", authRouter);
api.use("/quizzes", quizRouter);

export default api;
