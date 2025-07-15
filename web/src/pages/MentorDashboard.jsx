import { useState } from "react";
import { useNavigate } from "react-router";

// Helper to load quizzes from localStorage
const loadQuizzes = () => {
	const saved = localStorage.getItem("quizzes");
	return saved ? JSON.parse(saved) : [];
};

function MentorDashboard() {
	// Get current mentor ID from localStorage (MVP ONLY)
	// In production, get from session/auth backend
	const currentMentorId = Number(localStorage.getItem("currentMentorId"));
	const [quizzes, setQuizzes] = useState(loadQuizzes());
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [duration, setDuration] = useState(""); // in minutes
	const navigate = useNavigate();

	// Only quizzes for this mentor
	const myQuizzes = quizzes.filter((q) => q.user_id === currentMentorId);

	// Save quizzes to localStorage whenever they change
	const saveQuizzes = (newQuizzes) => {
		setQuizzes(newQuizzes);
		localStorage.setItem("quizzes", JSON.stringify(newQuizzes));
	};

	// Update quiz state in localStorage (MVP ONLY)
	// In production, replace with API/backend
	const updateQuizState = (quizId, updates) => {
		const updated = quizzes.map((q) =>
			q.id === quizId ? { ...q, ...updates } : q,
		);
		setQuizzes(updated);
		localStorage.setItem("quizzes", JSON.stringify(updated));
	};

	// Handle Run Quiz (open for join)
	const handleRunQuiz = (quizId) => {
		updateQuizState(quizId, { isRunning: true, isStarted: false });
	};

	// Handle Start Quiz (show questions)
	const handleStartQuiz = (quizId) => {
		updateQuizState(quizId, { isStarted: true });
	};

	// Handle form submit for creating a new quiz
	const handleCreateQuiz = (e) => {
		e.preventDefault();
		if (!title.trim() || !duration) return;
		const newQuiz = {
			id: quizzes.length ? Math.max(...quizzes.map((q) => q.id)) + 1 : 1,
			user_id: currentMentorId,
			title,
			description,
			duration: Number(duration) * 60,
			questions: [], // always add empty questions array for new quiz
		};
		const updated = [...quizzes, newQuiz];
		saveQuizzes(updated);
		navigate(`/mentor/quiz/${newQuiz.id}/edit`);
	};

	// If not logged in, show message (MVP ONLY)
	if (!currentMentorId) {
		return (
			<div className="p-4 text-center text-red-600">
				You must be logged in as a mentor to view your dashboard.
			</div>
		);
	}

	return (
		<div className="p-4 max-w-2xl mx-auto">
			<h1 className="text-2xl font-bold mb-4">Mentor Dashboard</h1>
			{/* Create New Quiz Form */}
			<form
				onSubmit={handleCreateQuiz}
				className="mb-8 space-y-4 border p-4 rounded"
			>
				<div>
					<label htmlFor="quiz-title" className="block font-medium mb-1">
						Title
					</label>
					<input
						id="quiz-title"
						className="border rounded px-2 py-1 w-full"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						required
					/>
				</div>
				<div>
					<label htmlFor="quiz-description" className="block font-medium mb-1">
						Description
					</label>
					<textarea
						id="quiz-description"
						className="border rounded px-2 py-1 w-full"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
				</div>
				<div>
					<label htmlFor="quiz-duration" className="block font-medium mb-1">
						Duration (minutes)
					</label>
					<input
						id="quiz-duration"
						className="border rounded px-2 py-1 w-32"
						type="number"
						min="1"
						value={duration}
						onChange={(e) => setDuration(e.target.value)}
						required
					/>
				</div>
				<button
					type="submit"
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
				>
					Create New Quiz
				</button>
			</form>
			{/* List of quizzes for current mentor */}
			<div>
				{myQuizzes.length === 0 ? (
					<p>No quizzes yet.</p>
				) : (
					<ul className="space-y-4">
						{myQuizzes.map((quiz) => (
							<li key={quiz.id} className="border p-4 rounded shadow-sm">
								<div className="font-semibold text-lg">{quiz.title}</div>
								<div className="text-gray-600 mb-2">{quiz.description}</div>
								<div className="text-sm text-gray-500 mb-2">
									Duration: {quiz.duration / 60} min
								</div>
								{/* Quiz status and actions (MVP ONLY) */}
								<div className="mb-2">
									{quiz.isStarted ? (
										<span className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs font-semibold">
											Started
										</span>
									) : quiz.isRunning ? (
										<>
											<span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-semibold mr-2">
												Open for Join
											</span>
											<button
												className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm mr-2"
												onClick={() => handleStartQuiz(quiz.id)}
											>
												Start Quiz
											</button>
										</>
									) : (
										<button
											className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm mr-2"
											onClick={() => handleRunQuiz(quiz.id)}
										>
											Run Quiz
										</button>
									)}
								</div>
								<button
									className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
									onClick={() => navigate(`/mentor/quiz/${quiz.id}/edit`)}
								>
									Edit
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

export default MentorDashboard;
