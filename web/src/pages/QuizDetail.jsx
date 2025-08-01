import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";

import { fetchQuizDetail, deleteQuiz } from "../services/quizService";

function QuizDetail() {
	const navigate = useNavigate();
	const { id } = useParams();

	// Session check: if not logged in, redirect to login
	useEffect(() => {
		const token = localStorage.getItem("token");
		const mentorId = localStorage.getItem("currentMentorId");
		if (!token || !mentorId) {
			navigate("/mentor/login");
		}
	}, [navigate]);

	// Quiz detail state
	const [quizDetail, setQuizDetail] = useState(null);
	const [loadingQuizDetail, setLoadingQuizDetail] = useState(false);
	const [quizDetailError, setQuizDetailError] = useState("");

	// Add delete handler
	const [deletingQuizId, setDeletingQuizId] = useState(null);

	// Fetch quiz detail when component mounts
	useEffect(() => {
		if (!id) return;
		const token = localStorage.getItem("token");
		setLoadingQuizDetail(true);
		setQuizDetailError("");
		fetchQuizDetail(token, id)
			.then((data) => setQuizDetail(data))
			.catch((err) =>
				setQuizDetailError(err.message || "Failed to load quiz detail."),
			)
			.finally(() => setLoadingQuizDetail(false));
	}, [id]);

	const handleDeleteQuiz = async (quizId) => {
		if (!window.confirm("Are you sure you want to delete this quiz?")) return;
		setDeletingQuizId(quizId);
		const token = localStorage.getItem("token");
		try {
			await deleteQuiz(token, quizId);
			navigate("/mentor/dashboard");
		} catch (err) {
			alert(err.message || "Failed to delete quiz.");
		} finally {
			setDeletingQuizId(null);
		}
	};

	return (
		<div className="max-w-2xl mx-auto">
			<button
				className="mb-6 px-4 py-2 rounded bg-purple-500 text-white hover:bg-purple-700 transition font-semibold shadow"
				onClick={() => navigate("/mentor/dashboard")}
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
						onClick={() => navigate(`/mentor/live/${quizDetail.id}`)}
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
							{deletingQuizId === quizDetail.id ? "Deleting..." : "Delete Quiz"}
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
								<li key={q.id} className="border rounded-lg p-4 bg-white mb-2">
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
}

export default QuizDetail;
