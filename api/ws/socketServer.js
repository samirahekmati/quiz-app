/**
 * Sets up socket.io event listeners
 * @param {import('socket.io').Server} io - The socket.io server instance
 */

import jwt from "jsonwebtoken";

import config from "../utils/config.js";
import logger from "../utils/logger.js";
// In-memory timer state for each quiz (quizId)
const quizTimers = {};

export function setupSocketServer(io) {
	// Emit timer-sync to all clients in each active quiz room every second
	setInterval(() => {
		Object.entries(quizTimers).forEach(([quizId, timer]) => {
			if (timer.startedAt && !timer.endedAt) {
				const elapsed = Math.floor(
					(Date.now() - new Date(timer.startedAt).getTime()) / 1000,
				);
				const remaining = Math.max(0, timer.duration - elapsed);
				io.to(quizId).emit("timer-sync", {
					startedAt: timer.startedAt,
					duration: remaining,
					endedAt: timer.endedAt,
				});
			}
		});
	}, 1000);

	// Socket.io middleware for JWT verification (mentor only)
	io.use((socket, next) => {
		const token = socket.handshake.auth?.token || socket.handshake.query?.token;
		if (token) {
			try {
				const decoded = jwt.verify(token, config.jwtSecret);
				socket.userId = decoded.id;
				// Set role to 'mentor' for any valid JWT (no need for role in JWT or DB)
				socket.role = "mentor";
			} catch {
				// Invalid token: block mentor, allow student (MVP)
				return next(new Error("Invalid or expired token"));
			}
		} else {
			// No token: treat as student (MVP)
			socket.userId = socket.handshake.auth?.userId || null;
			socket.role = socket.handshake.auth?.role || "student";
		}
		next();
	});

	// Listen for new client connections
	io.on("connection", (socket) => {
		logger.info(`[socket.io] Client connected: ${socket.id}`);

		// Listen for client disconnect
		socket.on("disconnect", (reason) => {
			logger.info(`[socket.io] Client disconnected: ${socket.id} (${reason})`);

			// Find all rooms this socket was in
			const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
			rooms.forEach((quizId) => {
				// Emit updated room-users to all clients in the room (real-time update)
				io.in(quizId)
					.fetchSockets()
					.then((clients) => {
						const users = clients.map((s) => ({
							userId: s.handshake.auth?.userId || s.userId || "unknown",
							role: s.handshake.auth?.role || s.role || "unknown",
						}));
						io.to(quizId).emit("room-users", { users });
					});
			});
		});

		/**
		 * Reconnect handling:
		 * If a student or mentor disconnects and reconnects, the client should emit 'join-room' again with quizId, userId, and role.
		 * The server will re-add the user to the room. Optionally, broadcast 'user-reconnected' to the room for live updates.
		 */

		// Listen for join-room event from client
		/**
		 * Client requests to join a quiz room
		 * @param {Object} data - { quizId: string, userId: string, role: string }
		 */
		socket.on("join-room", (data) => {
			logger.info(`[DEBUG] join-room event received:`, data);
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
			// Optionally, broadcast user-reconnected for reconnect scenarios
			socket.to(quizId).emit("user-reconnected", { userId, role });

			// Emit updated room-users to all clients in the room (real-time update)
			io.in(quizId)
				.fetchSockets()
				.then((clients) => {
					const users = clients.map((s) => ({
						userId: s.handshake.auth?.userId || s.userId || "unknown",
						role: s.handshake.auth?.role || s.role || "unknown",
					}));
					io.to(quizId).emit("room-users", { users });
				});
		});

		/**
		 * Mentor starts the quiz for all users in the room
		 * @param {Object} data - { quizId: string, startedAt: string (ISO), duration: number (seconds) }
		 */
		socket.on("quiz-started", (data) => {
			logger.info(`[DEBUG] quiz-started event received:`, data);
			const { quizId, startedAt, duration } = data;
			if (!quizId || !startedAt || !duration) {
				socket.emit("error", {
					message: "quizId, startedAt, and duration are required to start quiz",
				});
				return;
			}
			// If timer already exists for this quiz, clear it (prevent duplicate)
			if (quizTimers[quizId]?.timeout) {
				clearTimeout(quizTimers[quizId].timeout);
			}
			// Track timer state in memory
			quizTimers[quizId] = {
				startedAt,
				duration,
				endedAt: null,
				timeout: setTimeout(() => {
					// Timer finished, end quiz for all
					const endedAt = new Date().toISOString();
					io.to(quizId).emit("quiz-ended", { endedAt });
					logger.info(
						`[socket.io] Quiz auto-ended in room: ${quizId} (endedAt: ${endedAt})`,
					);
					quizTimers[quizId].endedAt = endedAt;
				}, duration * 1000),
			};
			// Broadcast to all clients in the room that the quiz has started
			io.to(quizId).emit("quiz-started", { startedAt, duration });
			logger.info(
				`[socket.io] Quiz started in room: ${quizId} (startedAt: ${startedAt}, duration: ${duration}s)`,
			);
		});

		/**
		 * Student submits an answer to a quiz question (real-time)
		 * Logic is implemented here (not in answers/ or quiz/) to avoid conflicts for now.
		 * This handler validates data and saves the answer directly to the DB.
		 * @param {Object} data - { quizId: string, userId: string, questionId: string, answer: string }
		 */
		socket.on("submit-answer", async (data) => {
			logger.info("[DEBUG] submit-answer event received:", data);
			const { quizId, userId, questionId, answer } = data;
			if (!quizId || !userId || !questionId || !answer) {
				logger.info("[DEBUG] submit-answer missing fields", {
					quizId,
					userId,
					questionId,
					answer,
				});
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
				logger.info("[DEBUG] submit-answer DB values:", values);
				const { rows } = await import("../db.js").then((m) =>
					m.default.query(query, values),
				);
				logger.info(
					`[socket.io] Answer submitted by user ${userId} for quiz ${quizId}, question ${questionId}`,
				);
				socket.emit("answer-received", { success: true, answer: rows[0] });
				// Emit progress-update to mentor in the room
				// Find all sockets in the room with role 'mentor'
				const clients = await io.in(quizId).fetchSockets();
				clients
					.filter(
						(s) => s.handshake.auth?.role === "mentor" || s.role === "mentor",
					)
					.forEach((mentorSocket) => {
						mentorSocket.emit("progress-update", {
							quizId,
							userId,
							questionId,
							answer,
							timestamp: new Date().toISOString(),
						});
					});
			} catch (err) {
				logger.error("[socket.io] Error saving answer:", err);
				socket.emit("error", { message: "Failed to save answer" });
			}
		});

		/**
		 * Mentor ends the quiz for all users in the room (force end)
		 * @param {Object} data - { quizId: string, endedAt: string (ISO) }
		 */
		socket.on("quiz-ended", (data) => {
			const { quizId, endedAt } = data;
			if (!quizId || !endedAt) {
				socket.emit("error", {
					message: "quizId and endedAt are required to end quiz",
				});
				return;
			}
			// If timer exists, clear it (force end)
			if (quizTimers[quizId]?.timeout) {
				clearTimeout(quizTimers[quizId].timeout);
				quizTimers[quizId].endedAt = endedAt;
			}
			// Broadcast to all clients in the room that the quiz has ended
			io.to(quizId).emit("quiz-ended", { endedAt });
			logger.info(
				`[socket.io] Quiz ended in room: ${quizId} (endedAt: ${endedAt}) [force end]`,
			);
		});

		/**
		 * Timer sync: client requests current timer state for a quiz
		 * @param {Object} data - { quizId: string }
		 * Responds with { startedAt, duration, endedAt }
		 */
		socket.on("timer-sync", (data) => {
			logger.info(`[DEBUG] timer-sync event received:`, data);
			const { quizId } = data;
			if (!quizId) {
				socket.emit("error", { message: "quizId is required for timer sync" });
				return;
			}
			const timer = quizTimers[quizId];
			if (!timer) {
				socket.emit("timer-sync", {
					startedAt: null,
					duration: null,
					endedAt: null,
				});
			} else {
				// Calculate remaining time
				let remaining = null;
				if (timer.startedAt && !timer.endedAt) {
					const elapsed = Math.floor(
						(Date.now() - new Date(timer.startedAt).getTime()) / 1000,
					);
					remaining = Math.max(0, timer.duration - elapsed);
				} else if (timer.endedAt) {
					remaining = 0;
				}
				socket.emit("timer-sync", {
					startedAt: timer.startedAt,
					duration: remaining,
					endedAt: timer.endedAt,
				});
			}
		});

		/**
		 * Mentor requests the list of users in a quiz room for live dashboard
		 * @param {Object} data - { quizId: string }
		 * Responds with 'room-users' event: { users: [{ userId, role }] }
		 */
		socket.on("get-room-users", async (data) => {
			const { quizId } = data;
			if (!quizId) {
				socket.emit("error", {
					message: "quizId is required to get room users",
				});
				return;
			}
			// Get all sockets in the room
			const clients = await io.in(quizId).fetchSockets();
			// Collect userId and role from each socket if available
			const users = clients.map((s) => ({
				userId: s.handshake.auth?.userId || s.userId || "unknown",
				role: s.handshake.auth?.role || s.role || "unknown",
			}));
			socket.emit("room-users", { users });
			logger.info(`[socket.io] Sent room-users for quiz ${quizId} to mentor`);
		});
	});
}
