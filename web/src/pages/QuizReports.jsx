import { useState, useEffect } from "react";

import getApiBaseUrl from "../services/apiBaseUrl";
import { fetchStudents } from "../services/quizService";

function QuizReports() {
	const [quizzes, setQuizzes] = useState([]);
	const [error, setError] = useState("");
	// state for the selected quiz
	const [selectedQuiz, setSelectedQuiz] = useState(null);
	const [students, setStudents] = useState({ summary: [], details: [] });

	useEffect(() => {
		async function fetchQuizReports() {
			setError("");

			// Check if user is logged in
			const token = localStorage.getItem("token");
			if (!token) {
				setError("Not authenticated");
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
			}
		}

		fetchQuizReports();
	}, []);
	// when quiz clicked, fetch students
	async function handleQuizClick(quizId) {
		setSelectedQuiz(quizId);

		try {
			const token = localStorage.getItem("token");
			const students = await fetchStudents(token, quizId);
			setStudents(students);
		} catch {
			setError("Failed to fetch students.");
		} finally {
			// setLoadingStudents(false); // This line was removed
		}
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
		<div className="max-w-5xl mx-auto">
			{!selectedQuiz ? (
				<>
					<h2 className="text-2xl font-bold mb-6 text-purple-800">
						Quiz Reports
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
						{quizzes
							.filter((quiz) => quiz.quiz_status === "completed")
							.map((quiz) => (
								<button
									key={quiz.id}
									type="button"
									onClick={() => handleQuizClick(quiz.id)}
									className="bg-orange-100 rounded-lg shadow p-6 border border-orange-200 relative w-full text-left hover:scale-105 transition-transform focus:outline-none"
									aria-label={`View quiz ${quiz.title}`}
								>
									<h2 className="text-lg font-bold text-orange-900 mb-2">
										{quiz.title}
									</h2>
									<p className="text-orange-700 mb-2">{quiz.description}</p>
									<div className="flex justify-between items-center mt-4">
										<span className="bg-orange-500 text-white px-2 py-1 rounded text-xs">
											Students: {quiz.students_participated || 0}
										</span>
										<span className="bg-orange-300 text-orange-900 px-2 py-1 rounded text-xs">
											{quiz.total_questions || 0} questions
										</span>
									</div>
								</button>
							))}
					</div>
				</>
			) : (
				<div>
					<button
						onClick={() => setSelectedQuiz(null)}
						className="mb-6 px-4 py-2 bg-orange-500 text-white rounded shadow hover:bg-orange-700 transition font-semibold"
					>
						← Back to Quiz Reports
					</button>

					<h2 className="text-xl font-semibold mb-4 text-orange-800">
						Students
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
						{students.summary.map((student, index) => (
							<button
								key={index}
								type="button"
								onClick={() =>
									console.log("Student clicked:", student.username)
								}
								className="bg-orange-100 rounded-lg shadow p-4 border border-orange-200 relative w-full text-left hover:scale-105 transition-transform focus:outline-none"
								aria-label={`View student ${student.username}`}
							>
								<h4 className="font-bold text-orange-900">
									{student.username}
								</h4>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export default QuizReports;
