import { useState } from "react";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import getApiBaseUrl from "../services/apiBaseUrl";
import {
	connectSocket,
	emitEvent,
	onEvent,
	offEvent,
} from "../services/socket";

function StudentJoin() {
	const [username, setUsername] = useState("");
	const [quizId, setQuizId] = useState("");
	const [error, setError] = useState("");
	const [showError, setShowError] = useState(false);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const isQuizIdFromUrl = searchParams.has("quizId");

	// On component mount, check for quizId in URL
	useEffect(() => {
		const quizIdFromUrl = searchParams.get("quizId");
		if (quizIdFromUrl) {
			setQuizId(quizIdFromUrl);
		}
	}, [searchParams]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			// Check quiz existence via API
			const res = await fetch(`${getApiBaseUrl()}/quizzes/${quizId}`);
			if (!res.ok) {
				setError("Quiz ID is invalid or quiz not found.");
				setLoading(false);
				return;
			}
			// Connect socket (student)
			connectSocket({ userId: username, role: "student" });
			// Set student username in cookie for backend identification (MVP)
			document.cookie = `username=${encodeURIComponent(username)}; path=/; max-age=86400`;
			// Also save username in localStorage for StudentQuiz.jsx
			localStorage.setItem("studentUsername", username);
			// Emit join-room event
			emitEvent("join-room", { quizId, userId: username, role: "student" });
			// Listen for room-joined
			onEvent("room-joined", () => {
				navigate(`/student/quiz/${quizId}`);
			});
			// Listen for error
			onEvent("error", (err) =>
				setError(err.message || "Failed to join quiz."),
			);
		} catch {
			setError("Network error. Please try again.");
			setShowError(true);
			setTimeout(() => setShowError(false), 4000);
		} finally {
			setLoading(false);
		}
	};

	// Cleanup listeners on unmount
	useEffect(() => {
		return () => {
			offEvent("room-joined");
			offEvent("error");
		};
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-400 to-cyan-500 flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				{/* Error alert at the top (dismissable) */}
				{showError && error && (
					<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between shadow-lg">
						<span>{error}</span>
						<button
							className="ml-4 text-red-700 font-bold px-2"
							onClick={() => setShowError(false)}
							aria-label="Dismiss error"
						>
							×
						</button>
					</div>
				)}
				<div className="bg-white rounded-2xl shadow-2xl p-8">
					<h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
						Join Quiz
					</h1>
					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label
								htmlFor="username"
								className="block font-medium mb-2 text-gray-700"
							>
								Your Name
							</label>
							<input
								id="username"
								className="border-gray-300 border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder="Enter your name"
								required
							/>
						</div>
						<div>
							<label
								htmlFor="quiz-id"
								className="block font-medium mb-2 text-gray-700"
							>
								Quiz ID
							</label>
							<input
								id="quiz-id"
								className="border-gray-300 border rounded-lg px-4 py-2 w-full disabled:bg-gray-200 disabled:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
								type="number"
								value={quizId}
								onChange={(e) => setQuizId(e.target.value)}
								placeholder="Enter the quiz ID"
								required
								disabled={isQuizIdFromUrl}
							/>
						</div>
						{error && !showError && (
							<div className="text-red-600 text-sm text-center">{error}</div>
						)}
						<button
							type="submit"
							className="w-full px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300 transform hover:scale-105"
							disabled={loading}
						>
							{loading ? "Joining..." : "Join the Quiz!"}
						</button>
					</form>
				</div>
				<button
					className="mt-6 w-full px-4 py-2 text-green rounded-lg hover:bg-white hover:bg-opacity-20 transition"
					type="button"
					onClick={() => navigate("/")}
				>
					Back to Home
				</button>
			</div>
		</div>
	);
}

export default StudentJoin;
