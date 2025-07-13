import { Router } from "express";
import { createQuiz, getQuizById } from "./quizController.js";
import { createQuestion } from "../questions/questionController.js";

const router = Router();

// Route to create a new quiz
router.post("/", createQuiz);
router.post("/:quizId/questions", createQuestion);
router.get("/:quizId", getQuizById);

export default router;