import { pool } from "../db.js" 
import logger from "../utils/logger.js";

export async function submitAnswer(req, res) {
    try {
      const username = req.cookies.username;
      const { quizId } = req.params;
      const { questionId, selectedOption } = req.body;
  
      if (!username || !questionId || !selectedOption) {
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      // INSERT into the database — using raw SQL, Sequelize, or query builder
      const query = `
        INSERT INTO answers (username, quiz_id, question_id, selected_option)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const values = [username, quizId, questionId, selectedOption];
  
      const result = await pool.query(query, values);
  
      res.status(201).json({ message: "Answer submitted", answer: result.rows[0] });
    } catch (err) {
      logger.error("Error saving answer:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }


