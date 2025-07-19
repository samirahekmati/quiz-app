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
	});
}
