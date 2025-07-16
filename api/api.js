import { Router } from "express";

import authRouter from "./auth/authRouter.js";
import messageRouter from "./messages/messageRouter.js";
import quizRouter from "./quiz/quizRouter.js";

const api = Router();
// For testing only: mock user
// api.use((req, res, next) => {
//     req.user = { username: "Samira" }; // hardcoded username for testing
//     next();
//   });
api.use("/message", messageRouter);
api.use("/auth", authRouter);
api.use("/quizzes", quizRouter);

export default api;
