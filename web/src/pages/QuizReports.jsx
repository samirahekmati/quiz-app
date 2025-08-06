import { useState, useEffect } from "react";

import getApiBaseUrl from "../services/apiBaseUrl";
import { fetchStudents } from "../services/quizService";

function QuizReports() {
	const [quizzes, setQuizzes] = useState([]);
	const [error, setError] = useState("");
	// state for current view and selected student
	const [currentView, setCurrentView] = useState("quiz-list"); // 'quiz-list', 'student-list', 'student-details'
	const [selectedStudent, setSelectedStudent] = useState(null);
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
	// handle quiz or student clicks
	async function handleQuizOrStudentClick(id, type) {
		if (type === "quiz") {
			// Fetch students for quiz
			setCurrentView("student-list");

			try {
				const token = localStorage.getItem("token");
				const students = await fetchStudents(token, id);
				setStudents(students);
			} catch {
				setError("Failed to fetch students.");
			}
		} else if (type === "student") {
			// Show student details
			setSelectedStudent(id); // id is actually username
			setCurrentView("student-details");
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
			{currentView === "quiz-list" ? (
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
									onClick={() => handleQuizOrStudentClick(quiz.id, "quiz")}
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
			) : currentView === "student-list" ? (
				<div>
					<button
						onClick={() => {
							setCurrentView("quiz-list");
							setSelectedStudent(null);
						}}
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
									handleQuizOrStudentClick(student.username, "student")
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
			) : (
				<div>
					<button
						onClick={() => {
							setCurrentView("student-list");
							setSelectedStudent(null);
						}}
						className="mb-6 px-4 py-2 bg-orange-500 text-white rounded shadow hover:bg-orange-700 transition font-semibold"
					>
						← Back to Students
					</button>

					<h2 className="text-xl font-semibold mb-4 text-orange-800">
						Student Report: {selectedStudent}
					</h2>

					{(() => {
						// Filter student data
						const studentDetails = students.details.filter(
							(detail) => detail.username === selectedStudent,
						);

						if (studentDetails.length === 0) {
							return (
								<div className="bg-white rounded-lg shadow p-6">
									<p className="text-gray-500">
										No data found for this student.
									</p>
								</div>
							);
						}

						// Calculate statistics
						const totalQuestions = studentDetails.length;
						const correctAnswers = studentDetails.filter(
							(detail) => detail.is_correct,
						).length;
						const incorrectAnswers = totalQuestions - correctAnswers;

						// fetch student score and status
						const studentSummary = students.summary.find(
							(s) => s.username === selectedStudent,
						);
						const percentage = studentSummary ? studentSummary.percentage : 0;
						const status = studentSummary ? studentSummary.status : "";

						return (
							<div className="space-y-6">
								{/* Statistics */}
								<div className="bg-white rounded-lg shadow p-6">
									<h3 className="text-lg font-semibold mb-4 text-gray-800">
										Summary
									</h3>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
										<div className="text-center">
											<div className="text-2xl font-bold text-blue-600">
												{totalQuestions}
											</div>
											<div className="text-sm text-gray-600">
												Total Questions
											</div>
										</div>
										<div className="text-center">
											<div className="text-2xl font-bold text-green-600">
												{correctAnswers}
											</div>
											<div className="text-sm text-gray-600">Correct</div>
										</div>
										<div className="text-center">
											<div className="text-2xl font-bold text-red-600">
												{incorrectAnswers}
											</div>
											<div className="text-sm text-gray-600">Incorrect</div>
										</div>
										{/* student score and status */}
										<div className="text-center ">
											<div
												className={`text-xl font-semibold -mb-2 ${status === "Passed" ? "text-green-700" : "text-red-700"}`}
											>
												{status}
											</div>
											<div
												className={`text-2xl font-bold ${status === "Passed" ? "text-green-600" : "text-red-600"}`}
											>
												{percentage}%
											</div>
										</div>
									</div>
								</div>

								{/* Questions List */}
								<div className="bg-white rounded-lg shadow p-6">
									<h3 className="text-lg font-semibold mb-4 text-gray-800">
										Question Details
									</h3>
									<div className="space-y-4">
										{studentDetails.map((detail, index) => (
											<div
												key={index}
												className={`p-4 rounded-lg border ${
													detail.is_correct
														? "bg-green-50 border-green-200"
														: "bg-red-50 border-red-200"
												}`}
											>
												<div className="flex items-start justify-between mb-2">
													<h4 className="font-semibold text-gray-800">
														Question {index + 1}
													</h4>
													{!detail.is_correct && (
														<span className="bg-red-500 text-white px-2 py-1 rounded text-xs">
															Wrong
														</span>
													)}
												</div>
												<p className="text-gray-700 mb-2">
													{detail.question_text}
												</p>
												<p className="text-sm">
													<span className="font-medium">Answer: </span>
													<span
														className={
															detail.is_correct
																? "text-green-700"
																: "text-red-700"
														}
													>
														{detail.student_answer}
													</span>
												</p>
											</div>
										))}
									</div>
								</div>
							</div>
						);
					})()}
				</div>
			)}
		</div>
	);
}

export default QuizReports;
