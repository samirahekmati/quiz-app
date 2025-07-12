import { Router } from "express";
import { createQuestion } from "./questionController.js";

const router = Router();

router.post("/:quizId/questions", createQuestion); // POST /api/quizzes/:quizId/questions

export default router;