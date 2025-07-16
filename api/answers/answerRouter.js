import { Router } from "express";
import { submitAnswer } from "../answers/answerController.js";
import { getQuizResult } from "./resultController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router({ mergeParams: true });

router.post("/", submitAnswer ); // POST /api/quizzes/:quizId/answers
router.get("/results", authMiddleware,getQuizResult ) // Get /api/quizzes/:quizId/answers/results

export default router;