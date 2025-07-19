/**
 * Sets up socket.io event listeners
 * @param {import('socket.io').Server} io - The socket.io server instance
 */
import logger from "../utils/logger.js";

export function setupSocketServer(io) {
	// Listen for new client connections
	io.on("connection", (socket) => {
		logger.info(`[socket.io] Client connected: ${socket.id}`);

		// Listen for client disconnect
		socket.on("disconnect", (reason) => {
			logger.info(`[socket.io] Client disconnected: ${socket.id} (${reason})`);
		});

		// Listen for join-room event from client
		/**
		 * Client requests to join a quiz room
		 * @param {Object} data - { quizId: string, userId: string, role: string }
		 */
		socket.on("join-room", (data) => {
			const { quizId, userId, role } = data;
			if (!quizId) {
				socket.emit("error", { message: "quizId is required to join room" });
				return;
			}
			// Join the socket.io room for this quiz
			socket.join(quizId);
			logger.info(
				`[socket.io] User ${userId || "unknown"} (${role || "unknown"}) joined room: ${quizId}`,
			);
			// Confirm join to the client
			socket.emit("room-joined", { quizId });
			// Broadcast to all other clients in the room that a new user joined
			socket.to(quizId).emit("user-joined", { userId, role });
		});

		/**
		 * Mentor starts the quiz for all users in the room
		 * @param {Object} data - { quizId: string, startedAt: string (ISO), duration: number (seconds) }
		 */
		socket.on("quiz-started", (data) => {
			const { quizId, startedAt, duration } = data;
			if (!quizId || !startedAt || !duration) {
				socket.emit("error", {
					message: "quizId, startedAt, and duration are required to start quiz",
				});
				return;
			}
			// Broadcast to all clients in the room that the quiz has started
			io.to(quizId).emit("quiz-started", { startedAt, duration });
			logger.info(
				`[socket.io] Quiz started in room: ${quizId} (startedAt: ${startedAt}, duration: ${duration}s)`,
			);
		});

		/**
		 * Student submits an answer to a quiz question (real-time)
		 * Logic is implemented here (not in answers/ or quiz/) to avoid conflicts forr now.
		 * This handler validates data and saves the answer directly to the DB.
		 * @param {Object} data - { quizId: string, userId: string, questionId: string, answer: string }
		 */
		socket.on("submit-answer", async (data) => {
			const { quizId, userId, questionId, answer } = data;
			if (!quizId || !userId || !questionId || !answer) {
				socket.emit("error", {
					message:
						"quizId, userId, questionId, and answer are required to submit answer",
				});
				return;
			}
			try {
				// Direct DB access
				const query = `
          INSERT INTO answers (username, quiz_id, question_id, selected_option)
          VALUES ($1, $2, $3, $4)
          RETURNING *;
        `;
				const values = [userId, quizId, questionId, answer];
				const { rows } = await import("../db.js").then((m) =>
					m.default.query(query, values),
				);
				logger.info(
					`[socket.io] Answer submitted by user ${userId} for quiz ${quizId}, question ${questionId}`,
				);
				socket.emit("answer-received", { success: true, answer: rows[0] });
			} catch (err) {
				logger.error("[socket.io] Error saving answer:", err);
				socket.emit("error", { message: "Failed to save answer" });
			}
		});
	});
}
