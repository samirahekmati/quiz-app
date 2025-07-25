import { Router } from "express";

import {
	createQuestion,
	updateQuestion,
	deleteQuestion,
} from "./questionController.js";

const router = Router({ mergeParams: true });

router.post("/", createQuestion); // POST /api/quizzes/:quizId/questions
router.put("/:questionId", updateQuestion); // Put /api/quizzes/:quizId/questions/questionId
router.delete("/:questionId", deleteQuestion); // Delete /api/quizzes/quizId/questions/questionId

export default router;
