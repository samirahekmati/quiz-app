import { useState } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";

import getApiBaseUrl from "../services/apiBaseUrl";

function MentorSignup() {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const [success, setSuccess] = useState(false);

	// Simple email format check
	const isValidEmail = (email) => /.+@.+\..+/.test(email);

	// Handle form submit
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		if (!username.trim() || !email.trim() || !password.trim()) {
			setError("All fields are required.");
			return;
		}
		if (!isValidEmail(email)) {
			setError("Invalid email format.");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(`${getApiBaseUrl()}/auth/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: email.trim().toLowerCase(),
					username: username.trim(),
					password,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.message || "Registration failed.");
				setLoading(false);
				return;
			}
			// Instead of navigating and storing token, just show success
			setSuccess(true);
		} catch {
			setError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
					Create Account
				</h1>

				{success ? (
					// ✅ Success message view
					<div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded">
						<p className="mb-2">Registration successful!</p>
						<button
							className="btn-primary "
							type="button"
							onClick={() => {
								console.log("Sign in button clicked");
								navigate("/mentor/login");
							}}
						>
							Sign in
						</button>
					</div>
				) : (
					//  Registration form (only shown when not success)
					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label
								htmlFor="username"
								className="block text-sm font-medium text-gray-700 mb-2"
							>
								Username
							</label>
							<input
								id="username"
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900 placeholder-gray-500"
								placeholder="Enter your username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
							/>
						</div>
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700 mb-2"
							>
								Email
							</label>
							<input
								id="email"
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900 placeholder-gray-500"
								type="email"
								placeholder="Enter your email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700 mb-2"
							>
								Password
							</label>
							<input
								id="password"
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900 placeholder-gray-500"
								type="password"
								placeholder="Enter your password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>
						{error && <div className="text-red-600 text-sm">{error}</div>}
						<button type="submit" className="btn-primary" disabled={loading}>
							{loading ? "Signing up..." : "Sign Up"}
						</button>

						<div className="text-center mt-4">
							<span className="text-gray-600">Already have an account? </span>

							<Link
								to="/mentor/login"
								className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
							>
								Sign in
							</Link>
						</div>
					</form>
				)}

				{/* Always show back to home button */}
				<button
					className="mt-6 btn-secondary"
					type="button"
					onClick={() => navigate("/")}
				>
					Back to Home
				</button>
			</div>
		</div>
	);
}

export default MentorSignup;
