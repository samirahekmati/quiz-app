import db, { pool } from "../db.js";
import logger from "../utils/logger.js";

// Create a question along with its options for a given quiz
export async function createQuestion(req, res) {
	console.log("req.params:", req.params);
	const { quizId } = req.params;
	const { text, type, options } = req.body;

	// Validate quizId
	if (!quizId || isNaN(Number(quizId))) {
		return res.status(400).json({ message: "Valid quizId is required in the URL." });
	}

	// Validate question text
	if (!text || typeof text !== "string" || text.trim() === "") {
		return res.status(400).json({ message: "Question text is required." });
	}

	//validate question type
	const allowedTypes = ['multiple_choice', 'true_false', 'fill_in_blank'];

	if (type && !allowedTypes.includes(type)) {
	  return res.status(400).json({ 
		message: `Invalid question type. Allowed types: ${allowedTypes.join(', ')}`
	  });
	}

	// Validate options array
	if (!Array.isArray(options) || options.length < 2) {
		return res.status(400).json({ message: "At least two options are required." });
	}

	// Validate each option
	for (const option of options) {
		if (
			!option.text ||
			typeof option.text !== "string" ||
			typeof option.is_correct !== "boolean" ||
			option.text.trim() === ""
		) {
			return res.status(400).json({
				message: "Each option must have 'text' (string) and 'is_correct' (boolean).",
			});
		}
	}

	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		// Insert the question
		const questionResult = await client.query(
			`INSERT INTO questions (quiz_id, text, type)
			 VALUES ($1, $2, $3)
			 RETURNING id, quiz_id, text, type`,
			[quizId, text, type || "multiple_choice"]
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
	const { text, type, options } = req.body;

	// Validate quizId and questionId
	if (!quizId || isNaN(Number(quizId))) {
		return res.status(400).json({ message: "Valid quizId is required in the URL." });
	  }
	if (!questionId || isNaN(Number(questionId))) {
		return res.status(400).json({ message: "Valid questionId is required in the URL." });
	  }

    // Validate question text
	if (!text || typeof text !== "string" || text.trim() === "") {
	  return res.status(400).json({ message: "Question text is required." });
	}

	// Validate question type
	const allowedTypes = ['multiple_choice', 'true_false', 'fill_in_blank'];
	if (type && !allowedTypes.includes(type)) {
	  return res.status(400).json({ message: `Invalid question type. Allowed types: ${allowedTypes.join(", ")}` });
	}

	// Validate options array
	if (!Array.isArray(options) || options.length < 2) {
	  return res.status(400).json({ message: "At least two options are required." });
	}
	// Validate each option
	for (const option of options) {
		if (!option.text || typeof option.text !== "string" || option.text.trim() === "") {
		  return res.status(400).json({ message: "Each option must have non-empty 'text' (string)." });
		}
		if (typeof option.is_correct !== "boolean") {
		  return res.status(400).json({ message: "Each option must have 'is_correct' (boolean)." });
		}
	  }
	
	// Connect to DB only after validations
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
		`UPDATE questions SET text = $1, type = $2 WHERE id = $3`,
		[text, type || "multiple_choice", questionId]
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
		// Make sure id is a valid number before running update
		if (isNaN(Number(option.id))) {
			throw new Error(`Invalid option id: ${option.id}`);
		  }
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

