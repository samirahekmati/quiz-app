import { z } from "zod";

import db, { pool } from "../db.js";
import logger from "../utils/logger.js";
import { liveQuizzes } from "../ws/socketServer.js";

// Define the schema for quiz creation
const createQuizSchema = z.object({
	title: z
		.string()
		.nonempty("Title is required and must be a non-empty string."),
	description: z.string().optional(),
	duration: z
		.number({ invalid_type_error: "Duration must be a number." })
		.positive("Duration must be a positive number."),
});

// Create a new quiz
export async function createQuiz(req, res) {
	// Validate req.body using Zod
	const parseResult = createQuizSchema.safeParse({
		...req.body,
		// Make sure to convert duration to a number since it might come as string
		duration: Number(req.body.duration),
	});

	if (!parseResult.success) {
		const errorMessage =
			parseResult.error.errors?.[0]?.message || "Invalid input data";
		// Log validation error to your logger
		logger.error(`Validation error: ${errorMessage}`);
		// Send first validation error message
		return res.status(400).json({ message: errorMessage });
	}

	const { title, description, duration } = parseResult.data;

	// Get user ID from request ( auth middleware sets req.user)
	const userId = req.user?.id;
	if (!userId) {
		return res.status(401).json({ message: "Unauthorized: User ID missing" });
	}

	try {
		const result = await db.query(
			`INSERT INTO quizzes (title, description, duration,user_id)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id, title, description, duration,user_id`,
			[title, description, duration, userId],
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

// Get a quiz along with its questions and options
export async function getQuizById(req, res) {
	const { quizId } = req.params;
	const { forStudent } = req.query;

	if (forStudent === "true") {
		const session = liveQuizzes[quizId];
		if (!session || (session.status !== "waiting" && session.status !== "started")) {
			return res.status(404).json({ message: "This quiz is not currently active or does not exist." });
		}
	}

	try {
		// Query to get quiz info + questions + options using JOINs
		const result = await db.query(
			`
		SELECT 
		  q.id as quiz_id, q.title, q.description, q.duration,
		  qs.id as question_id, qs.text as question_text, qs.type,
		  o.id as option_id, o.text as option_text, o.is_correct
		FROM quizzes q
		LEFT JOIN questions qs ON qs.quiz_id = q.id
		LEFT JOIN options o ON o.question_id = qs.id
		WHERE q.id = $1
		ORDER BY qs.id, o.id
		`,
			[quizId],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ message: "Quiz not found" });
		}

		// Use the first row as the base quiz object
		const base = result.rows[0];
		const quizData = {
			id: base.quiz_id,
			title: base.title,
			description: base.description,
			duration: base.duration,
			questions: [],
		};

		const questionsMap = new Map();

		for (const row of result.rows) {
			if (!row.question_id) continue; // no questions for this quiz

			if (!questionsMap.has(row.question_id)) {
				questionsMap.set(row.question_id, {
					id: row.question_id,
					text: row.question_text,
					type: row.type,
					options: [],
				});
			}

			if (row.option_id) {
				questionsMap.get(row.question_id).options.push({
					id: row.option_id,
					text: row.option_text,
					is_correct: row.is_correct,
				});
			}
		}

		quizData.questions = Array.from(questionsMap.values());

		res.json(quizData);
	} catch (error) {
		logger.error("Error fetching quiz:", error);
		res.status(500).json({ message: "Server error while fetching quiz" });
	}
}

// Get the quiz created by a specific user by userId
export async function getQuizzesByUser(req, res) {
	const userId = req.user.id;
	const includeReports = req.query.includeReports === "true";

	try {
		if (includeReports) {
			// Get quizzes with student participation data for reports
			const result = await db.query(
				`
				SELECT 
					q.id, 
					q.title, 
					q.description, 
					q.duration,
					q.created_at,
					q.started_at,
					q.ended_at,
					COUNT(DISTINCT a.username) as students_participated,
					(SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as total_questions,
					CASE 
						WHEN q.ended_at IS NOT NULL THEN 'completed'
						WHEN q.started_at IS NOT NULL AND q.ended_at IS NULL THEN 'in_progress'
						ELSE 'not_started'
					END as quiz_status
				FROM quizzes q
				LEFT JOIN answers a ON q.id = a.quiz_id
				WHERE q.user_id = $1
				GROUP BY q.id, q.title, q.description, q.duration, q.created_at, q.started_at, q.ended_at
				ORDER BY q.created_at DESC
				`,
				[userId],
			);

			res.json(result.rows);
		} else {
			// Original query for dashboard (existing functionality)
			const result = await db.query(
				`
				SELECT id, title, description, duration
				FROM quizzes
				WHERE user_id = $1
				ORDER BY created_at DESC
				`,
				[userId],
			);

			res.json(result.rows);
		}
	} catch (error) {
		logger.error("Error fetching quizzes by user:", error);
		res
			.status(500)
			.json({ message: "Server error while fetching your quizzes" });
	}
}

// Delete a quiz and its questions
export async function deleteQuiz(req, res) {
	const { quizId } = req.params;

	try {
		// Delete options linked to questions of this quiz
		await db.query(
			`DELETE FROM options 
		 WHERE question_id IN (SELECT id FROM questions WHERE quiz_id = $1)`,
			[quizId],
		);

		// Delete questions linked to this quiz
		await db.query("DELETE FROM questions WHERE quiz_id = $1", [quizId]);

		// Delete the quiz
		const result = await db.query(
			"DELETE FROM quizzes WHERE id = $1 RETURNING *",
			[quizId],
		);

		if (result.rowCount === 0) {
			return res.status(404).json({ message: "Quiz not found" });
		}

		res
			.status(200)
			.json({ message: "Quiz deleted successfully", quiz: result.rows[0] });
	} catch (error) {
		logger.error("Error deleting quiz:", error);
		res.status(500).json({ message: "Server error while deleting quiz" });
	}
}

export const updateQuizSchema = z.object({
	title: z.string().min(1, "Title is required").optional(),
	description: z.string().min(1, "Description is required").optional(),
	duration: z.number().min(1, "Duration must be a positive number").optional,
});

export async function updateQuiz(req, res) {
	const { quizId } = req.params;
	const { title, description, duration } = req.body;

	if (!quizId || isNaN(Number(quizId))) {
		return res
			.status(400)
			.json({ message: "Valid quizId is required in the URL." });
	}

	const client = await pool.connect();

	try {
		// Fetch existing quiz data
		const existingResult = await client.query(
			"SELECT * FROM quizzes WHERE id = $1",
			[quizId],
		);

		if (existingResult.rowCount === 0) {
			return res.status(404).json({ message: "Quiz not found" });
		}

		const existingQuiz = existingResult.rows[0];

		// Use existing values if no new values provided
		const updatedTitle = title !== undefined ? title : existingQuiz.title;
		const updatedDescription =
			description !== undefined ? description : existingQuiz.description;
		const updatedDuration =
			duration !== undefined ? duration : existingQuiz.duration;

		// Validate required fields after merge
		if (!updatedTitle || updatedTitle.trim() === "") {
			return res.status(400).json({ message: "Title cannot be empty." });
		}
		if (
			updatedDuration === null ||
			updatedDuration === undefined ||
			isNaN(Number(updatedDuration))
		) {
			return res
				.status(400)
				.json({ message: "Duration must be a valid number." });
		}

		// Update quiz record
		await client.query(
			`UPDATE quizzes SET title = $1, description = $2, duration = $3 WHERE id = $4`,
			[updatedTitle, updatedDescription, updatedDuration, quizId],
		);

		res.status(200).json({ message: "Quiz updated successfully" });
	} catch (error) {
		logger.error("Error updating quiz:", error);
		res.status(500).json({ message: "Internal server error" });
	} finally {
		client.release();
	}
}

// get all students who have taken a quiz with detailed reports
// Route: GET /api/quizzes/:quizId/students
export async function getQuizStudents(req, res) {
	const { quizId } = req.params;

	try {
		// Get detailed question/answer breakdown
		const detailsResult = await db.query(
			`
			SELECT 
				a.username,
				q.text as question_text,
				o.text as student_answer,
				o.is_correct,
				a.submitted_at
			FROM answers a
			JOIN questions q ON a.question_id = q.id
			JOIN options o ON a.question_id = o.question_id AND a.selected_option = o.id::text
			WHERE a.quiz_id = $1
			ORDER BY a.username, a.question_id
		`,
			[quizId],
		);

		// Get summary counts for each student
		const summaryResult = await db.query(
			`
			SELECT 
				a.username,
				COUNT(CASE WHEN o.is_correct THEN 1 END) as correct_answers,
				COUNT(CASE WHEN o.is_correct = false THEN 1 END) as incorrect_answers,
				COUNT(*) as total_answers
			FROM answers a
			JOIN options o ON a.question_id = o.question_id AND a.selected_option = o.id::text
			WHERE a.quiz_id = $1
			GROUP BY a.username
			ORDER BY a.username
		`,
			[quizId],
		);

		// Combine the data
		const response = {
			summary: summaryResult.rows,
			details: detailsResult.rows,
		};

		res.json(response);
	} catch (error) {
		logger.error("Error fetching quiz students:", error);
		res
			.status(500)
			.json({ message: "Server error while fetching quiz students" });
	}
}
