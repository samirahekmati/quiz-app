import { pool } from "../db.js";

export const getQuizResult = async (req, res) => {
  const { quizId } = req.params;
  const username = req.user?.username;

  if (!username) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Get all answers by the user for this quiz
    const { rows: answers } = await pool.query(
      `
      SELECT a.question_id, a.selected_option, o.is_correct
      FROM answers a
      JOIN options o
      ON a.question_id = o.question_id AND a.selected_option = o.text
      WHERE a.username = $1 AND a.quiz_id = $2;
      `,
      [username, quizId]
    );

    let correct = 0;
    let incorrect = 0;

    answers.forEach((a) => {
      if (a.is_correct) {
        correct++;
      } else {
        incorrect++;
      }
    });

    res.json({
      username,
      quizId: Number(quizId),
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      total: correct + incorrect,
    });
  } catch (error) {
    logger.error("Error fetching quiz results:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};