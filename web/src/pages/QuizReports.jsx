import { useState, useEffect } from "react";

import getApiBaseUrl from "../services/apiBaseUrl";

function QuizReports() {
	const [quizzes, setQuizzes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		async function fetchQuizReports() {
			setLoading(true);
			setError("");

			// Check if user is logged in
			const token = localStorage.getItem("token");
			if (!token) {
				setError("Not authenticated");
				setLoading(false);
				return;
			}

			try {
				const response = await fetch(
					`${getApiBaseUrl()}/quizzes/mine?includeReports=true`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					},
				);
				const data = await response.json();

				if (!response.ok) {
					setError(data.message || "Failed to fetch quiz reports");
				} else {
					setQuizzes(data);
				}
			} catch {
				setError("Network error. Please try again.");
			} finally {
				setLoading(false);
			}
		}

		fetchQuizReports();
	}, []);

	if (loading) {
		return (
			<div className="p-6">
				<h1 className="text-2xl font-bold mb-6">Quiz Reports</h1>
				<div className="text-center py-8">
					<p>Loading quiz reports...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-6">
				<h1 className="text-2xl font-bold mb-6">Quiz Reports</h1>
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
					{error}
				</div>
			</div>
		);
	}

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Quiz Reports</h1>
			<div className="grid gap-4">
				{quizzes
					.filter((quiz) => quiz.quiz_status === "completed")
					.map((quiz) => (
						<div
							key={quiz.id}
							className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
						>
							<h3 className="text-lg font-semibold">{quiz.title}</h3>
							<p className="text-gray-600">{quiz.description}</p>
							<div className="mt-2 text-sm text-gray-500">
								<span className="mr-4">
									Students: {quiz.students_participated || 0}
								</span>
								<span className="mr-4">
									Questions: {quiz.total_questions || 0}
								</span>
							</div>
						</div>
					))}
			</div>
		</div>
	);
}

export default QuizReports;
