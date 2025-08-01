import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";

import getApiBaseUrl from "../services/apiBaseUrl";

function StudentResult() {
	const { quizId } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const totalQuestions = location.state?.totalQuestions;

	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showError, setShowError] = useState(false);

	useEffect(() => {
		async function fetchResult() {
			setLoading(true);
			setError("");
			setShowError(false);
			try {
				if (!quizId) {
					setError("Missing quiz ID.");
					setShowError(true);
					setLoading(false);
					return;
				}
				// Rely on cookie for student identification
				const res = await fetch(
					`${getApiBaseUrl()}/quizzes/${quizId}/answers/results`,
					{
						credentials: "include",
					},
				);
				const data = await res.json();
				if (!res.ok) {
					setError(data.message || "Failed to fetch result.");
					setShowError(true);
					setLoading(false);
					return;
				}
				setResult(data);
			} catch {
				setError("Network error. Please try again.");
				setShowError(true);
			} finally {
				setLoading(false);
			}
		}
		fetchResult();
	}, [quizId]);

	return (
		<div className="p-4 max-w-md mx-auto text-center">
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
			<h1 className="text-2xl text-green-800 font-bold mb-4">Quiz Result</h1>
			{loading ? (
				<div className="border p-4 rounded bg-gray-50 text-gray-600 text-center">
					<p className="mb-2 font-semibold">Loading result...</p>
				</div>
			) : result ? (
				<div className="border p-4 rounded bg-green-50 text-green-800 text-center space-y-2">
					<p className="font-semibold text-lg">
						Thanks, {result.username}!
					</p>
					<p>You&apos;ve finished the quiz. Here is your result:</p>
					<ul className="list-inside pt-2 inline-block text-left">
						<li className = "text-green-700">Correct Answers: {result.correctAnswers}</li>
						<li className = "text-red-700">Incorrect Answers: {result.incorrectAnswers}</li>
						<li className = "text-blue-700">Total Questions: {totalQuestions ?? result.total}</li>
					</ul>
				</div>
			) : (
				<div className="border p-4 rounded bg-gray-50 text-gray-600 text-center">
					<p className="mb-2 font-semibold">No result found.</p>
				</div>
			)}
			<button
				className="mt-4 px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition"
				onClick={() => navigate("/student/join")}
			>
				Back to Join
			</button>
		</div>
	);
}

export default StudentResult;
