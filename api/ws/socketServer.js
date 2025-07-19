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
	});
}
