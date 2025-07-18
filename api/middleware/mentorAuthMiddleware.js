import jwt from "jsonwebtoken";

import config from "../utils/config.js";

const JWT_SECRET = config.jwtSecret;

export function mentorAuthMiddleware(req, res, next) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

	if (!token) {
		return res.status(401).json({ error: "Unauthorized - no token provided" });
	}

	jwt.verify(token, JWT_SECRET, (err, user) => {
		if (err) {
			return res.status(403).json({ error: "Forbidden - invalid token" });
		}
		req.user = user;
		next();
	});
}
