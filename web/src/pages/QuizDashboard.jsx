import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import {
	fetchQuizzes,
	fetchQuizDetail,
	deleteQuiz,
} from "../services/quizService";

function QuizDashboard() {
	const navigate = useNavigate();

	// Session check: if not logged in, redirect to login
	useEffect(() => {
		const token = localStorage.getItem("token");
		const mentorId = localStorage.getItem("currentMentorId");
		if (!token || !mentorId) {
			navigate("/mentor/login");
		}
	}, [navigate]);

	// Quizzes state
	const [quizzes, setQuizzes] = useState([]);
	const [loadingQuizzes, setLoadingQuizzes] = useState(false);
	const [quizzesError, setQuizzesError] = useState("");

	// Quiz detail state
	const [selectedQuiz, setSelectedQuiz] = useState(null); // quiz object
	const [quizDetail, setQuizDetail] = useState(null); // fetched quiz detail (questions/answers)
	const [loadingQuizDetail, setLoadingQuizDetail] = useState(false);
	const [quizDetailError, setQuizDetailError] = useState("");

	// Add delete handler
	const [deletingQuizId, setDeletingQuizId] = useState(null);

	// Fetch quizzes on component mount
	useEffect(() => {
		const token = localStorage.getItem("token");
		setLoadingQuizzes(true);
		setQuizzesError("");
		fetchQuizzes(token)
			.then((data) => setQuizzes(data || []))
			.catch((err) => setQuizzesError(err.message || "Failed to load quizzes."))
			.finally(() => setLoadingQuizzes(false));
	}, []);

	// Fetch quiz detail when selectedQuiz changes
	useEffect(() => {
		if (!selectedQuiz) return;
		const token = localStorage.getItem("token");
		setLoadingQuizDetail(true);
		setQuizDetailError("");
		fetchQuizDetail(token, selectedQuiz.id)
			.then((data) => setQuizDetail(data))
			.catch((err) =>
				setQuizDetailError(err.message || "Failed to load quiz detail."),
			)
			.finally(() => setLoadingQuizDetail(false));
	}, [selectedQuiz]);

	const handleDeleteQuiz = async (quizId) => {
		if (!window.confirm("Are you sure you want to delete this quiz?")) return;
		setDeletingQuizId(quizId);
		const token = localStorage.getItem("token");
		try {
			await deleteQuiz(token, quizId);
			setQuizzes((prev) => prev.filter((q) => q.id !== quizId));

			setSelectedQuiz(null);
			setQuizDetail(null);
		} catch (err) {
			alert(err.message || "Failed to delete quiz.");
		} finally {
			setDeletingQuizId(null);
		}
	};

	// Main content
	let mainContent = null;
	if (selectedQuiz) {
		// Quiz detail view
		mainContent = (
			<div className="max-w-2xl mx-auto">
				<button
					className="mb-6 px-4 py-2 rounded bg-purple-500 text-white hover:bg-purple-700 transition font-semibold shadow"
					onClick={() => {
						setSelectedQuiz(null);
						setQuizDetail(null);
					}}
				>
					← Return to Dashboard
				</button>
				{loadingQuizDetail ? (
					<div className="flex justify-center items-center h-32">
						<span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></span>
					</div>
				) : quizDetailError ? (
					<div className="text-red-500">{quizDetailError}</div>
				) : quizDetail ? (
					<div className="bg-purple-100 p-8 rounded-2xl shadow-lg border-t-4 border-purple-500 relative">
						{/* Start this quiz button */}
						<button
							className="absolute left-8 top-8 px-4 py-2 bg-green-500 text-white rounded shadow hover:bg-green-700 transition font-semibold"
							onClick={() => navigate(`/mentor/live/${selectedQuiz.id}`)}
						>
							Run this Quiz
						</button>
						{/* Edit this quiz button + Delete (container) */}
						<div className="absolute right-8 top-8 flex items-center space-x-4">
							<button
								className="px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-700 transition font-semibold"
								onClick={() => handleDeleteQuiz(quizDetail.id)}
								disabled={deletingQuizId === quizDetail.id}
							>
								{deletingQuizId === quizDetail.id
									? "Deleting..."
									: "Delete Quiz"}
							</button>
							<button
								className="px-4 py-2 bg-purple-500 text-white rounded shadow hover:bg-purple-700 transition font-semibold"
								onClick={() => navigate(`/mentor/quiz/${quizDetail.id}/edit`)}
							>
								Edit this quiz
							</button>
						</div>
						<h2 className="text-2xl font-bold mb-2 text-purple-800 mt-16">
							{quizDetail.title}
						</h2>
						<div className="mb-2 text-purple-700">{quizDetail.description}</div>
						<div className="mb-4 text-sm text-purple-400">
							Duration: {Math.round(quizDetail.duration / 60)} min
						</div>
						<h3 className="text-lg font-semibold mb-4 text-purple-700">
							Questions & Answers
						</h3>
						{quizDetail.questions && quizDetail.questions.length > 0 ? (
							<ul className="space-y-6">
								{quizDetail.questions.map((q, idx) => (
									<li
										key={q.id}
										className="border rounded-lg p-4 bg-white mb-2"
									>
										<div className="font-semibold mb-2 text-purple-800">
											Q{idx + 1}: {q.text}
										</div>
										<ul className="list-disc pl-6 space-y-1 text-left">
											{q.options.map((opt) => (
												<li
													key={opt.id}
													className={
														opt.is_correct
															? "text-green-600 font-semibold"
															: "text-purple-700"
													}
												>
													{opt.text}{" "}
													{opt.is_correct && (
														<span className="ml-2 px-2 py-0.5 rounded bg-green-200 text-green-800 text-xs">
															Correct
														</span>
													)}
												</li>
											))}
										</ul>
									</li>
								))}
							</ul>
						) : (
							<div>No questions found for this quiz.</div>
						)}
					</div>
				) : null}
			</div>
		);
	} else {
		// Dashboard: show quizzes
		mainContent = (
			<div className="max-w-5xl mx-auto">
				<h2 className="text-2xl font-bold mb-6 text-purple-800">
					Your Quizzes
				</h2>
				{loadingQuizzes ? (
					<div className="flex justify-center items-center h-32">
						<span className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></span>
					</div>
				) : quizzesError ? (
					<div className="text-red-500">{quizzesError}</div>
				) : quizzes.length === 0 ? (
					<div>No quizzes found.</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
						{quizzes.map((quiz) => (
							<button
								key={quiz.id}
								type="button"
								onClick={() => setSelectedQuiz(quiz)}
								className="bg-purple-100 rounded-lg shadow p-6 border border-purple-200 relative w-full text-left hover:scale-105 transition-transform focus:outline-none"
								aria-label={`View quiz ${quiz.title}`}
							>
								<h2 className="text-lg font-bold text-purple-900 mb-2">
									{quiz.title}
								</h2>
								<p className="text-purple-700 mb-2">{quiz.description}</p>
								<div className="flex justify-between items-center mt-4">
									<span className="bg-purple-500 text-white px-2 py-1 rounded text-xs">
										ID: {quiz.id}
									</span>
									<span className="bg-purple-300 text-purple-900 px-2 py-1 rounded text-xs">
										{Math.round(quiz.duration / 60)} min
									</span>
								</div>
							</button>
						))}
					</div>
				)}
			</div>
		);
	}

	return <div className="w-full">{mainContent}</div>;
}

export default QuizDashboard;
