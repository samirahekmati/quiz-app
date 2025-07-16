import { Router } from "express";
import { createQuiz, getQuizById, deleteQuiz } from "./quizController.js";
import questionRouter from "../questions/questionRouter.js"
import answerRouter from "../answers/answerRouter.js"

const quizRouter = Router();

// Route to create a new quiz
quizRouter.post("/", createQuiz); // api/quizzes
// Route to Get quiz with id (questions and options)
quizRouter.get("/:quizId", getQuizById) // Get api/quizzes/:quizId
// Route to Delete quiz with id (questions and options)
quizRouter.delete("/:quizId", deleteQuiz); //DELETE /api/quizzes/:quizId
// Mount questionRouter to handle all question-related routes for a specific quiz
quizRouter.use("/:quizId/questions", questionRouter)
// Mount answerRouter to handle all answer-related routes for a specific quiz
quizRouter.use("/:quizId/answers",answerRouter)

export default quizRouter;