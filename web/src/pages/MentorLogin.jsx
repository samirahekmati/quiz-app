import { useState } from "react";
import { useNavigate } from "react-router";

import getApiBaseUrl from "../services/apiBaseUrl";

function MentorLogin() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	// Simple email format check
	const isValidEmail = (email) => /.+@.+\..+/.test(email);

	// Handle form submit
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		if (!email.trim() || !password.trim()) {
			setError("All fields are required.");
			return;
		}
		if (!isValidEmail(email)) {
			setError("Invalid email format.");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.message || "Login failed.");
				setLoading(false);
				return;
			}
			// Save token and user info (MVP: localStorage)
			localStorage.setItem("token", data.token);
			localStorage.setItem("currentMentorId", data.user.id);
			localStorage.setItem("mentorEmail", data.user.email);
			localStorage.setItem("mentorUsername", data.user.name || "");
			navigate("/mentor/dashboard");
		} catch {
			setError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-4 max-w-md mx-auto">
			<h1 className="text-2xl font-bold mb-4">Mentor Login</h1>
			<form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded">
				<div>
					<label htmlFor="email" className="block font-medium mb-1">
						Email
					</label>
					<input
						id="email"
						className="border rounded px-2 py-1 w-full"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
				</div>
				<div>
					<label htmlFor="password" className="block font-medium mb-1">
						Password
					</label>
					<input
						id="password"
						className="border rounded px-2 py-1 w-full"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</div>
				{error && <div className="text-red-600 text-sm">{error}</div>}
				<button
					type="submit"
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
					disabled={loading}
				>
					{loading ? "Logging in..." : "Login"}
				</button>
			</form>
			<button
				className="mt-4 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
				type="button"
				onClick={() => navigate("/")}
			>
				Back to Home
			</button>
		</div>
	);
}

export default MentorLogin;
