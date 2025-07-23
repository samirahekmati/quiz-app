import { Router } from "express";

import answerRouter from "../answers/answerRouter.js";
import { mentorAuthMiddleware } from "../middleware/mentorAuthMiddleware.js";
import questionRouter from "../questions/questionRouter.js";

import {
	createQuiz,
	getQuizById,
	deleteQuiz,
	updateQuiz,
} from "./quizController.js";

const quizRouter = Router();

// Route to create a new quiz
quizRouter.post("/", mentorAuthMiddleware, createQuiz); // api/quizzes
// Route to Get quiz with id (questions and options)
quizRouter.get("/:quizId", getQuizById); // Get api/quizzes/:quizId
// Route to Delete quiz with id (questions and options)
quizRouter.delete("/:quizId", deleteQuiz); // DELETE /api/quizzes/:quizId
// Route to update quiz with id
quizRouter.put("/:quizId", updateQuiz); // PUT /api/quizzes/:quizId
// Mount questionRouter to handle all question-related routes for a specific quiz
quizRouter.use("/:quizId/questions", questionRouter);
// Mount answerRouter to handle all answer-related routes for a specific quiz
quizRouter.use("/:quizId/answers", answerRouter);

export default quizRouter;
