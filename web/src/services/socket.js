import { io } from "socket.io-client";

/**
 * Socket.io-client instance for real-time quiz events.
 * Handles connection, disconnection, event emit/listen.
 * Mentor: pass JWT as token. Student: pass userId and role.
 */
let socket = null;

/**
 * Connect to socket.io server.
 * @param {Object} param0 - { token, userId, role }
 * @returns {Socket} socket.io-client instance
 */
export function connectSocket({ token, userId, role }) {
	if (socket) return socket;
	socket = io(import.meta.env.VITE_API_URL || "http://localhost:3000", {
		auth: token ? { token } : { userId, role: role || "student" },
		autoConnect: true,
		transports: ["websocket"],
	});
	return socket;
}

/**
 * Disconnect from socket.io server and cleanup.
 */
export function disconnectSocket() {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
}

/**
 * Emit an event to the server.
 * @param {string} event - event name
 * @param {any} data - event payload
 */
export function emitEvent(event, data) {
	if (socket) socket.emit(event, data);
}

/**
 * Listen for an event from the server.
 * @param {string} event - event name
 * @param {function} handler - callback
 */
export function onEvent(event, handler) {
	if (socket) socket.on(event, handler);
}

/**
 * Remove event listener.
 * @param {string} event - event name
 * @param {function} handler - callback
 */
export function offEvent(event, handler) {
	if (socket) socket.off(event, handler);
}
