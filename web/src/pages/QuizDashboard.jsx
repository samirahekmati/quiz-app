import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import { fetchQuizzes } from "../services/quizService";

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

	return (
		<div className="w-full">
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
								onClick={() => navigate(`/mentor/quiz/${quiz.id}`)}
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
		</div>
	);
}

export default QuizDashboard;
