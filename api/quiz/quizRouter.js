import { Router } from "express";
import { createQuiz, getQuizById } from "./quizController.js";
import questionRouter from "../questions/questionRouter.js"

const quizRouter = Router();

// Route to create a new quiz
quizRouter.post("/", createQuiz); // api/quizzes
// Route to Get quiz with id (questions and options)
quizRouter.get("/:quizId", getQuizById) // Get api/quizzes/:quizId
// Mount questionRouter to handle all question-related routes for a specific quiz
quizRouter.use("/:quizId/questions", questionRouter)

export default quizRouter;