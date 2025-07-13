import db, { pool } from "../db.js";
import logger from "../utils/logger.js";

// Create a question along with its options for a given quiz
export async function createQuestion(req, res) {
	const { quizId } = req.params;
	const { text, type, difficulty_level, options } = req.body;

	if (!text) {
		return res.status(400).json({ message: "Question text is required." });
	}

	if (!Array.isArray(options) || options.length === 0) {
		return res.status(400).json({ message: "At least one option is required." });
	}

	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		// Insert the question
		const questionResult = await client.query(
			`INSERT INTO questions (quiz_id, text, type, difficulty_level)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id, quiz_id, text, type, difficulty_level`,
			[quizId, text, type || "multiple_choice", difficulty_level || null]
		);

		const question = questionResult.rows[0];

		// Insert the options
		for (const option of options) {
			const { text: optionText, is_correct } = option;

			if (!optionText) {
				throw new Error("Each option must have text.");
			}

			await client.query(
				`INSERT INTO options (question_id, text, is_correct)
				 VALUES ($1, $2, $3)`,
				[question.id, optionText, is_correct || false]
			);
		}

		await client.query("COMMIT");

		res.status(201).json({
			message: "Question and options created successfully",
			question,
		});
	} catch (error) {
		await client.query("ROLLBACK");
		logger.error("Error creating question and options:", error);
		res.status(500).json({ message: "Server error while creating question and options" });
	} finally {
		client.release();
	}
}