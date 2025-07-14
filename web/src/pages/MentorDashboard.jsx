import { useState } from "react";
import { useNavigate } from "react-router";

// Mock data for quizzes (should be replaced with API/backend later)
const initialMockQuizzes = [
	{
		id: 1,
		user_id: 1,
		title: "JavaScript Basics",
		description: "A quiz about JS fundamentals.",
		duration: 900, // seconds (15 min)
	},
	{
		id: 2,
		user_id: 2,
		title: "React Intro",
		description: "Test your React knowledge!",
		duration: 600, // seconds (10 min)
	},
];

function MentorDashboard() {
	// Get current mentor ID from localStorage (MVP ONLY)
	// In production, get from session/auth backend
	const currentMentorId = Number(localStorage.getItem("currentMentorId"));
	const [quizzes, setQuizzes] = useState(initialMockQuizzes);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [duration, setDuration] = useState(""); // in minutes
	const navigate = useNavigate();

	// Filter quizzes for current mentor (MVP ONLY)
	// In production, fetch quizzes for this mentor from backend/database
	const myQuizzes = quizzes.filter((q) => q.user_id === currentMentorId);

	// Handle form submit for creating a new quiz
	const handleCreateQuiz = (e) => {
		e.preventDefault();
		if (!title.trim() || !duration) return;
		// Create new quiz object
		const newQuiz = {
			id: quizzes.length ? Math.max(...quizzes.map((q) => q.id)) + 1 : 1, // unique id
			user_id: currentMentorId, // assign to current mentor
			title,
			description,
			duration: Number(duration) * 60, // convert to seconds
		};
		setQuizzes([...quizzes, newQuiz]);
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
								{/* Edit button (no action yet) */}
								<button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">
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
