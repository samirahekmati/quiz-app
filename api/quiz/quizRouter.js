import { Router } from "express";
import { createQuiz } from "./quizController.js";

const router = Router();

// Route to create a new quiz
router.post("/", createQuiz);

export default router;