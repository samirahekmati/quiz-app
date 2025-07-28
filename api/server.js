import http from "http";

import { Server as SocketIOServer } from "socket.io";

import { connectDb } from "./db.js";
import config from "./utils/config.js";
import logger from "./utils/logger.js";
import { setupSocketServer } from "./ws/socketServer.js";

const { port } = config.init();

await connectDb();

const { default: app } = await import("./app.js");

// Create HTTP server from Express app
const server = http.createServer(app);

// Initialize socket.io with the HTTP server
const io = new SocketIOServer(server, {
	cors: {
		origin: "*", // TODO: Set allowed origins for production
		methods: ["GET", "POST"],
	},
});

// Setup modular socket.io event logic
setupSocketServer(io);

// Export io for use in other modules
export { io };

// Start the server (Express + socket.io)
server.listen(port, () => logger.info(`listening on ${port}`));
