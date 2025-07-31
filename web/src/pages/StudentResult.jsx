import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";

import getApiBaseUrl from "../services/apiBaseUrl";

function StudentResult() {
	const { quizId } = useParams();
	const navigate = useNavigate();
	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchResult = async () => {
			setLoading(true);
			try {
				const res = await fetch(
					`${getApiBaseUrl()}/quizzes/${quizId}/answers/results`,
					{
						credentials: "include",
					},
				);

				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.error || "Failed to fetch result.");
				}
				setResult(data);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		if (quizId) {
			fetchResult();
		}
	}, [quizId]);

	return (
		<div className="p-4 max-w-2xl mx-auto text-center font-sans">
			<h1 className="text-3xl font-bold mb-6 text-gray-800">Quiz Result</h1>

			{loading && (
				<div className="p-6 rounded-lg bg-gray-100 text-gray-700">
					<p className="font-semibold text-lg">Loading your result...</p>
				</div>
			)}

			{error && (
				<div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
					<p className="font-bold">Error</p>
					<p>{error}</p>
				</div>
			)}

			{result && (
				<div className="border p-6 rounded-lg bg-blue-50 text-blue-800 shadow-md">
					<p className="mb-4 text-lg">
						Dear{" "}
						<span className="font-bold text-blue-900">{result.username}</span>,
						you completed the Quiz, here is your result:
					</p>
					<div className="text-base space-y-2">
						<p>
							Correct answers:{" "}
							<span className="font-semibold">{result.correctAnswers}</span>
						</p>
						<p>
							Incorrect answers:{" "}
							<span className="font-semibold">{result.incorrectAnswers}</span>
						</p>
						<p>
							Total questions:{" "}
							<span className="font-semibold">{result.totalQuestions}</span>
						</p>
					</div>
				</div>
			)}

			<button
				className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 shadow"
				onClick={() => navigate("/student/join")}
			>
				Join Another Quiz
			</button>
		</div>
	);
}

export default StudentResult;
