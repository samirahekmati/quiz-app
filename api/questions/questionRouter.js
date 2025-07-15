import { Router } from "express";
import { createQuestion, updateQuestion } from "./questionController.js";

const router = Router({ mergeParams: true });

router.post("/", createQuestion); // POST /api/quizzes/:quizId/questions
router.put("/:questionId", updateQuestion) // Put /api/quizzes/:quizId/questions/questionId

export default router;