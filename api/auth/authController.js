import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import db from "../db.js";
import config from "../utils/config.js";
import logger from "../utils/logger.js";

const JWT_SECRET = config.jwtSecret;

// handle Login
export async function handleLogin(req, res) {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({
			message: "Email and password are required.",
		});
	}

	try {
		// Look up the user in the database
		const result = await db.query("SELECT * FROM users WHERE email = $1", [
			email,
		]);
		const user = result.rows[0];

		if (!user) {
			return res.status(401).json({ message: "Invalid email or password." });
		}

		// Compare password
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({ message: "Invalid email or password." });
		}

		// Generate a JWT token
		const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
			expiresIn: "7d",
		});

		res.status(200).json({
			message: "Login successful",
			user: { id: user.id, email: user.email, name: user.name },
			token,
		});
	} catch (err) {
		logger.error("Login error:", err);
		res.status(500).json({ message: "Server error during login." });
	}
}

// Handle Registration
export async function handleRegister(req, res) {
	const { email, password, username } = req.body;

	if (!email || !password || !username) {
		return res
			.status(400)
			.json({ message: "Email, username, and password are required" });
	}

	try {
		// Check if user already exists
		const userExists = await db.query("SELECT * FROM users WHERE email = $1", [
			email,
		]);
		if (userExists.rows.length > 0) {
			return res.status(409).json({
				error: "error 409",
				message: "User with this email already exists",
			});
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Insert new user
		const result = await db.query(
			"INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, email, username",
			[email, username, hashedPassword],
		);

		const newUser = result.rows[0];

		// Generate JWT
		const token = jwt.sign(
			{ id: newUser.id, email: newUser.email },
			JWT_SECRET,
			{
				expiresIn: "7d",
			},
		);

		res
			.status(201)
			.json({ token, user: newUser, message: "Registration successful." });
	} catch (err) {
		logger.error("Registration error:", err);
		res.status(500).json({
			message: "Something went wrong on our side, please try again later.",
		});
	}
}
