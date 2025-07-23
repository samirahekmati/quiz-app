import { useState } from "react";
import { useNavigate } from "react-router";

import getApiBaseUrl from "../services/apiBaseUrl";

function StudentJoin() {
	const [username, setUsername] = useState("");
	const [quizId, setQuizId] = useState("");
	const [error, setError] = useState("");
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
			// TODO: POST /api/quizzes/:quizId/join with { username } and save studentId for later use
			//
			// const joinRes = await fetch(`${getApiBaseUrl()}/quizzes/${quizId}/join`, {
			//   method: "POST",
			//   headers: { "Content-Type": "application/json" },
			//   body: JSON.stringify({ username }),
			// });
			// const joinData = await joinRes.json();
			// if (joinRes.ok) {
			//   localStorage.setItem("studentId", joinData.studentId);
			//   navigate(`/student/quiz/${quizId}`);
			// } else {
			//   setError(joinData.message || "Failed to join quiz.");
			// }
			navigate(`/student/quiz/${quizId}`);
		} catch {
			setError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-4 max-w-md mx-auto">
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
			{/* TODO: API integration for join quiz and username validation when backend endpoint is available */}
		</div>
	);
}

export default StudentJoin;
