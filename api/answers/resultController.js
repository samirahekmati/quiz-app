import { pool } from "../db.js";
import logger from "../utils/logger.js";

export const getQuizResult = async (req, res) => {
	const { quizId } = req.params;
	const username = req.user?.username; // Reading from authMiddleware

	if (!username) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	try {
		// Get the student's submitted answers, grouped by question
		const submittedAnswersQuery = pool.query(
			`SELECT question_id, array_agg(selected_option) as submitted_options
       FROM answers
       WHERE username = $1 AND quiz_id = $2
       GROUP BY question_id;`,
			[username, quizId],
		);

		// Get all correct options for the entire quiz, grouped by question
		const correctOptionsQuery = pool.query(
			`SELECT q.id as question_id, array_agg(o.id::text) as correct_options
       FROM questions q
       JOIN options o ON q.id = o.question_id
       WHERE q.quiz_id = $1 AND o.is_correct = true
       GROUP BY q.id;`,
			[quizId],
		);

		// Get the total number of questions for the quiz
		const totalQuestionsQuery = pool.query(
			`SELECT COUNT(*) FROM questions WHERE quiz_id = $1`,
			[quizId],
		);

		const [submittedResult, correctOptionsResult, totalQuestionsResult] =
			await Promise.all([
				submittedAnswersQuery,
				correctOptionsQuery,
				totalQuestionsQuery,
			]);

		const submittedAnswers = submittedResult.rows;
		const correctOptionsMap = new Map(
			correctOptionsResult.rows.map((row) => [
				row.question_id,
				row.correct_options.sort(),
			]),
		);
		const totalQuestions = parseInt(totalQuestionsResult.rows[0].count, 10);

		let correctAnswersCount = 0;

		// "All or nothing" scoring logic
		for (const submitted of submittedAnswers) {
			const correct = correctOptionsMap.get(submitted.question_id) || [];
			const submittedSorted = submitted.submitted_options.sort();

			// Check if the student's sorted answers are identical to the correct sorted answers
			if (
				correct.length === submittedSorted.length &&
				correct.every((val, index) => val === submittedSorted[index])
			) {
				correctAnswersCount++;
			}
		}

		const totalAnsweredCount = submittedAnswers.length;
		const incorrectAnswersCount = totalAnsweredCount - correctAnswersCount;

		res.json({
			username,
			quizId: Number(quizId),
			correctAnswers: correctAnswersCount,
			incorrectAnswers: incorrectAnswersCount,
			totalAnswered: totalAnsweredCount,
			totalQuestions,
		});
	} catch (error) {
		logger.error(`Error fetching quiz results for ${username}:`, error);
		res.status(500).json({ error: "Internal server error" });
	}
};