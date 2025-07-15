import { useState } from "react";
import { useNavigate } from "react-router";

// Helper to load quizzes from localStorage
const loadQuizzes = () => {
	const saved = localStorage.getItem("quizzes");
	return saved ? JSON.parse(saved) : [];
};

function StudentJoin() {
	const [username, setUsername] = useState("");
	const [quizId, setQuizId] = useState("");
	const [error, setError] = useState("");
	const [students, setStudents] = useState({}); // Initialize as empty object
	const [quizzes] = useState(loadQuizzes());
	const navigate = useNavigate();

	// Handle form submit
	const handleSubmit = (e) => {
		e.preventDefault();
		setError("");
		const id = Number(quizId);
		const quiz = quizzes.find((q) => q.id === id);
		if (!quiz) {
			setError("Quiz ID is invalid.");
			return;
		}
		if (!quiz.isRunning) {
			setError(
				"Quiz is not open for join yet. Please wait for the mentor to run the quiz.",
			);
			return;
		}
		// Check username is unique for this quiz
		const quizStudents = students[id] || [];
		if (quizStudents.includes(username.trim().toLowerCase())) {
			setError("Username is already taken for this quiz.");
			return;
		}
		// Add student to mock state (for MVP only)
		setStudents({
			...students,
			[id]: [...quizStudents, username.trim().toLowerCase()],
		});
		// Redirect to waiting page (placeholder)
		navigate(`/student/quiz/${id}`);
	};

	return (
		<div className="p-4 max-w-md mx-auto">
			<h1 className="text-2xl font-bold mb-4">Join Quiz</h1>
			<form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded">
				<div>
					<label htmlFor="username" className="block font-medium mb-1">
						Username
					</label>
					<input
						id="username"
						className="border rounded px-2 py-1 w-full"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
					/>
				</div>
				<div>
					<label htmlFor="quiz-id" className="block font-medium mb-1">
						Quiz ID
					</label>
					<input
						id="quiz-id"
						className="border rounded px-2 py-1 w-full"
						type="number"
						value={quizId}
						onChange={(e) => setQuizId(e.target.value)}
						required
					/>
				</div>
				{error && <div className="text-red-600 text-sm">{error}</div>}
				<button
					type="submit"
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
				>
					Join
				</button>
			</form>
		</div>
	);
}

export default StudentJoin;
