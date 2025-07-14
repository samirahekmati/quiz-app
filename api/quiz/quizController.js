import db from "../db.js";
import logger from "../utils/logger.js";

// Create a new quiz
export async function createQuiz(req, res) {
	const { title, description, duration } = req.body;

	// Validate title
	if (!title || typeof title !== "string" || title.trim() === "") {
		return res.status(400).json({ message: "Title is required and must be a non-empty string." });
	}

	// Validate duration
	if (
		duration === undefined ||
		isNaN(Number(duration)) ||
		Number(duration) <= 0
	) {
		return res.status(400).json({ message: "Duration is required and must be a positive number." });
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

// Get a quiz along with its questions and options
export async function getQuizById(req, res) {
	const { quizId } = req.params;
  
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
		[quizId]
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