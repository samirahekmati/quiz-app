import { useState } from "react";
import { useNavigate } from "react-router";

// Mock quizzes (should be replaced with API/backend later)
const mockQuizzes = [
	{ id: 1, title: "JavaScript Basics" },
	{ id: 2, title: "React Intro" },
];

// Mock students per quiz (should be replaced with API/backend later)
const initialMockStudents = {
	1: ["ali"], // quizId: [usernames]
	2: ["sara"],
};

function StudentJoin() {
	const [username, setUsername] = useState("");
	const [quizId, setQuizId] = useState("");
	const [error, setError] = useState("");
	const [students, setStudents] = useState(initialMockStudents);
	const navigate = useNavigate();

	// Handle form submit
	const handleSubmit = (e) => {
		e.preventDefault();
		setError("");
		const id = Number(quizId);
		// Check quiz ID exists
		const quizExists = mockQuizzes.some((q) => q.id === id);
		if (!quizExists) {
			setError("Quiz ID is invalid.");
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
		navigate(`/student/quiz/${id}/wait`);
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
