import db from "../db.js";
import logger from "../utils/logger.js";

// Create a new quiz
export async function createQuiz(req, res) {
	const { title, description, duration } = req.body;

	if (!title || !duration) {
		return res.status(400).json({
			message: "Title and duration are required.",
		});
	}

	try {
		const result = await db.query(
			`INSERT INTO quizzes (title, description, duration)
			 VALUES ($1, $2, $3)
			 RETURNING id, title, description, duration`,
			[title, description, duration]
		);

		const newQuiz = result.rows[0];

		res.status(201).json({
			message: "Quiz created successfully",
			quiz: newQuiz,
		});
	} catch (error) {
		logger.error("Error creating quiz:", error);
		res.status(500).json({ message: "Server error while creating quiz" });
	}
}