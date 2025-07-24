import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router";

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
		<div className="p-4 max-w-md mx-auto">
			{/* Error alert at the top (dismissable) */}
			{showError && error && (
				<div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded flex items-center justify-between">
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
			<h1 className="text-2xl font-bold mb-4">Join Quiz</h1>
			<form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded">
				<div>
					<label htmlFor="username" className="block font-medium mb-1">
						Username
					</label>
					<input
						id="username"
						className="border rounded px-2 py-1 w-full"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
					/>
				</div>
				<div>
					<label htmlFor="quiz-id" className="block font-medium mb-1">
						Quiz ID
					</label>
					<input
						id="quiz-id"
						className="border rounded px-2 py-1 w-full"
						type="number"
						value={quizId}
						onChange={(e) => setQuizId(e.target.value)}
						required
					/>
				</div>
				{error && <div className="text-red-600 text-sm">{error}</div>}
				<button
					type="submit"
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
					disabled={loading}
				>
					{loading ? "Joining..." : "Join"}
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

export default StudentJoin;
