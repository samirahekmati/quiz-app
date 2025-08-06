import { useState, useEffect } from "react";
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
	const [quizInfo, setQuizInfo] = useState(null);
	const [isFetchingQuiz, setIsFetchingQuiz] = useState(false);
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

	useEffect(() => {
		if (quizId) {
			setIsFetchingQuiz(true);
			fetch(`${getApiBaseUrl()}/quizzes/${quizId}?forStudent=true`)
				.then((res) => {
					if (!res.ok) {
						setQuizInfo(null);
						throw new Error("Quiz not active");
					}
					return res.json();
				})
				.then((data) => {
					setQuizInfo(data);
				})
				.catch(() => {
					setQuizInfo(null);
				})
				.finally(() => {
					setIsFetchingQuiz(false);
				});
		} else {
			setQuizInfo(null);
		}
	}, [quizId]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!quizInfo) {
			setError("This quiz is not active. Please check the ID or wait for the mentor.");
			setShowError(true);
			setTimeout(() => setShowError(false), 4000);
			return;
		}
		setError("");
		setLoading(true);
		try {
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
				navigate(`/student/quiz/${quizId}`, { state: { quizInfo } });
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
				<div className="bg-green-50 rounded-2xl shadow-2xl p-8">
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

						{isFetchingQuiz ? (
							<div className="text-center text-gray-500">
								Checking quiz status...
							</div>
						) : quizInfo ? (
							<div className="p-4 border rounded-lg bg-green-100 text-center">
								<h3 className="font-bold text-lg text-gray-800">Quiz Details</h3>
								<hr className="my-2" />
								{/* <p className="text-gray-700 mt-1 font-bold">Title</p> */}
								<p className="text-gray-700 mt-1 font-bold">{quizInfo.title}</p>
								{/* <p className="text-gray-700 mt-1 font-bold">Desctiption</p> */}
								<p className="text-gray-700 mt-1">{quizInfo.description}</p>
								<div className="text-m text-gray-700 mt-2">
									<span className="font-bold">Duration:</span> {Math.round(quizInfo.duration / 60)} min
								</div>
							</div>
						) : (
							quizId && (
								<div className="text-center text-red-500">
									This quiz is not currently active.
								</div>
							)
						)}

						{error && !showError && (
							<div className="text-red-600 text-sm text-center">{error}</div>
						)}
						<button
							type="submit"
							className="btn-student"
							disabled={loading}
						>
							{loading ? "Joining..." : "Join the Quiz!"}
						</button>
					</form>
				</div>
				<button
					className="btn-secondary mt-5"
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
