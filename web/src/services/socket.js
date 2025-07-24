import { io } from "socket.io-client";

/**
 * Socket.io-client instance for real-time quiz events.
 * Handles connection, disconnection, event emit/listen.
 * Mentor: pass JWT as token. Student: pass userId and role.
 */
let socket = null;
let reconnectHandler = null;

/**
 * Register a handler to run on socket connect/reconnect (for re-joining room, timer sync, etc.)
 * @param {function} handler - function to call on connect/reconnect
 */
export function registerReconnectHandler(handler) {
	reconnectHandler = handler;
	if (socket) {
		socket.off("connect", reconnectHandler);
		socket.off("reconnect", reconnectHandler);
		socket.on("connect", reconnectHandler);
		socket.on("reconnect", reconnectHandler);
	}
}

/**
 * Connect to socket.io server.
 * @param {Object} param0 - { token, userId, role }
 * @returns {Socket} socket.io-client instance
 */
export function connectSocket({ token, userId, role }) {
	if (socket) return socket;
	socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", {
		auth: token ? { token } : { userId, role: role || "student" },
		autoConnect: true,
		transports: ["websocket"],
	});
	// Attach reconnect handler if registered
	if (reconnectHandler) {
		socket.on("connect", reconnectHandler);
		socket.on("reconnect", reconnectHandler);
	}
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
