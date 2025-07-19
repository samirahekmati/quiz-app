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
	});
}
