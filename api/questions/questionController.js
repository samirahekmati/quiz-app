import logger from "../utils/logger.js";

import { z, ZodError } from "zod";

export const createQuestionSchema = z.object({
	text: z.string().min(1, "Question text is required."),
	type: z
	  .enum(["multiple_choice", "true_false", "fill_in_blank"])
	  .optional(),
	options: z
	  .array(
		z.object({
		  text: z.string().min(1, "Option text is required."),
		  is_correct: z.boolean(),
		})
	  )
	  .min(2, "At least two options are required."),
  });

// Create a question along with its options for a given quiz
export async function createQuestion(req, res) {
	console.log("req.params:", req.params);
	const { quizId } = req.params;
	//const { text, type, options } = req.body;

	// Validate quizId
	if (!quizId || isNaN(Number(quizId))) {
		return res.status(400).json({ message: "Valid quizId is required in the URL." });
	}

  // Validate request body using Zod
  const parseResult = createQuestionSchema.safeParse(req.body);

  if (!parseResult.success) {
	// Get the first error message (for response)
    const errorMessage =
      parseResult.error.errors?.[0]?.message || "Invalid input data";
// Log full detailed validation errors for debugging
logger.error("Validation error:", parseResult.error.format());
logger.error(`Validation error: ${errorMessage}`);
    return res.status(400).json({ message: errorMessage });
  }

  const { text, type = "multiple_choice", options } = parseResult.data;

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



const optionSchema = z.object({
	id: z.number().optional(), // For existing options that have an ID
	text: z.string().min(1, "Option text is required"),
	is_correct: z.boolean(),
  });
  
  const updateQuestionSchema = z.object({
	text: z.string().min(1, "Question text is required"),
	type: z.enum(['multiple_choice', 'true_false', 'fill_in_blank']).optional(),
	options: z.array(optionSchema).min(2, "At least two options are required"),
  });

// update question and options
export async function updateQuestion(req, res) {
	const { quizId, questionId } = req.params;

	// Validate quizId and questionId
	if (!quizId || isNaN(Number(quizId))) {
		return res.status(400).json({ message: "Valid quizId is required in the URL." });
	  }
	if (!questionId || isNaN(Number(questionId))) {
		return res.status(400).json({ message: "Valid questionId is required in the URL." });
	  }

  // Validate request body with Zod schema
  let validatedBody;
  try {
	validatedBody = updateQuestionSchema.parse(req.body);
  } catch (error) {
	if (error instanceof ZodError) {
	  // error.errors is guaranteed to exist here
	  const errors = error.issues.map(e => `${e.path.join('.')} - ${e.message}`);
	  return res.status(400).json({ message: errors.join('; ') });
	} else {
	  // For other types of errors
	  return res.status(400).json({ message: error.message || "Unknown error" });
	}
  }
	
	const { text, type, options } = validatedBody;

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

