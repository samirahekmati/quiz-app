import db, { pool } from "../db.js";
import logger from "../utils/logger.js";

// Create a question along with its options for a given quiz
export async function createQuestion(req, res) {
	console.log("req.params:", req.params);
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

// update question and options
export async function updateQuestion(req, res) {
	const { quizId, questionId } = req.params;
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
  
	  // Check that the question belongs to the quiz
	  const checkRes = await client.query(
		`SELECT id FROM questions WHERE id = $1 AND quiz_id = $2`,
		[questionId, quizId]
	  );
  
	  if (checkRes.rowCount === 0) {
		await client.query("ROLLBACK");
		return res.status(404).json({ message: "Question not found for this quiz." });
	  }
  
	  // Update the question
	  await client.query(
		`UPDATE questions SET text = $1, type = $2, difficulty_level = $3 WHERE id = $4`,
		[text, type || "multiple_choice", difficulty_level || null, questionId]
	  );
  
	  // Fetch existing option IDs for this question
	  const existingOptionsRes = await client.query(
		`SELECT id FROM options WHERE question_id = $1`,
		[questionId]
	  );
	  const existingOptionIds = existingOptionsRes.rows.map(row => row.id);
  
	  // Collect option IDs from the request (for updates) 
	  const incomingOptionIds = options.filter(o => o.id).map(o => o.id);
  
	  // Delete options not included in the update (optional)
	  const optionsToDelete = existingOptionIds.filter(id => !incomingOptionIds.includes(id));
	  if (optionsToDelete.length > 0) {
		await client.query(
		  `DELETE FROM options WHERE id = ANY($1)`,
		  [optionsToDelete]
		);
	  }
  
	  // Insert or update options
	  for (const option of options) {
		if (!option.text) {
		  throw new Error("Each option must have text.");
		}
  
		if (option.id) {
		  // Update existing option
		  await client.query(
			`UPDATE options SET text = $1, is_correct = $2 WHERE id = $3 AND question_id = $4`,
			[option.text, option.is_correct || false, option.id, questionId]
		  );
		} else {
		  // Insert new option
		  await client.query(
			`INSERT INTO options (question_id, text, is_correct) VALUES ($1, $2, $3)`,
			[questionId, option.text, option.is_correct || false]
		  );
		}
	  }
  
	  await client.query("COMMIT");
  
	  res.status(200).json({ message: "Question and options updated successfully." });
	} catch (error) {
	  await client.query("ROLLBACK");
	  logger.error("Error updating question and options:", error);
	  res.status(500).json({ message: "Server error while updating question and options." });
	} finally {
	  client.release();
	}
  }

