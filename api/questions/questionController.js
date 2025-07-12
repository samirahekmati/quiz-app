import db from "../db.js";
import logger from "../utils/logger.js";

// Create a question for a given quiz
export async function createQuestion(req, res) {
	const { quizId } = req.params;
	const { text, type, difficulty_level } = req.body;

	if (!text) {
		return res.status(400).json({ message: "Question text is required." });
	}

	try {
		const result = await db.query(
			`INSERT INTO questions (quiz_id, text, type, difficulty_level)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id, quiz_id, text, type, difficulty_level`,
			[quizId, text, type || "multiple_choice", difficulty_level || null]
		);

		const question = result.rows[0];

		res.status(201).json({
			message: "Question created successfully",
			question,
		});
	} catch (error) {
		logger.error("Error creating question:", error);
		res.status(500).json({ message: "Server error while creating question" });
	}
}