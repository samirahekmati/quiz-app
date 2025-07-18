import { useEffect, useState, useParams } from "react";
import { useNavigate } from "react-router";

import getApiBaseUrl from "../services/apiBaseUrl";

function StudentResult() {
	const { quizId } = useParams();
	const navigate = useNavigate();
	const [result, setResult] = useState(null);
	const [error, setError] = useState("");
	useEffect(() => {
		const studentId = localStorage.getItem("studentId");
		if (!studentId) {
			setError("Student ID not found.");
			return;
		}
		fetch(`${getApiBaseUrl()}/quizzes/${quizId}/result?studentId=${studentId}`)
			.then((res) => res.json())
			.then((data) => {
				if (data && !data.error) {
					setResult(data);
				} else {
					setError(data.message || "Failed to fetch result.");
				}
			})
			.catch(() => setError("Network error. Please try again."));
	}, [quizId]);

	return (
		<div className="p-4 max-w-md mx-auto text-center">
			<h1 className="text-2xl font-bold mb-4">Quiz Result</h1>
			{error && <div className="text-red-600 text-sm mb-2">{error}</div>}
			{result ? (
				<div className="border p-4 rounded bg-gray-50 text-gray-600 text-center">
					<p className="mb-2 font-semibold">Your Score: {result.score}</p>
					<p className="text-sm">
						{result.message || "Thank you for participating!"}
					</p>
				</div>
			) : (
				!error && (
					<div className="border p-4 rounded bg-gray-50 text-gray-600 text-center">
						<p className="mb-2 font-semibold">Loading result...</p>
					</div>
				)
			)}
			<button
				className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
				onClick={() => navigate("/student/join")}
			>
				Back to Join
			</button>
		</div>
	);
}

export default StudentResult;
