import { useState } from "react";
import { useNavigate } from "react-router";

import { createQuiz } from "../services/quizService";

function CreateQuiz() {
	const navigate = useNavigate();

	// Quiz creation state
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [duration, setDuration] = useState(""); // in minutes
	const [passScore, setPassingScore] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	// Handle quiz creation
	const handleCreateQuiz = async (e) => {
		e.preventDefault();
		setError("");
		if (!title.trim() || !duration) {
			setError("Title and duration are required.");
			return;
		}
		setLoading(true);
		const token = localStorage.getItem("token");
		try {
			const data = await createQuiz(token, {
				title: title.trim(),
				description: description.trim(),
				duration: Number(duration) * 60,
				passingScore: Number(passScore),
			});
			setTitle("");
			setDescription("");
			setDuration("");
			setPassingScore("");
			navigate(`/mentor/quiz/${data.quiz.id}/edit`);
		} catch (err) {
			setError(err.message || "Failed to create quiz.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-xl mx-auto">
			<h2 className="text-2xl font-bold mb-4 text-purple-800">
				Create New Quiz
			</h2>
			<form
				onSubmit={handleCreateQuiz}
				className="space-y-4 bg-purple-100 p-8 rounded-2xl shadow-lg border-t-4 border-purple-500"
			>
				<div>
					<label
						htmlFor="quiz-title"
						className="block font-medium mb-1 text-purple-700"
					>
						Title
					</label>
					<input
						id="quiz-title"
						className="border rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						required
					/>
				</div>
				<div>
					<label
						htmlFor="quiz-description"
						className="block font-medium mb-1 text-purple-700"
					>
						Description
					</label>
					<textarea
						id="quiz-description"
						className="border rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
				</div>
				<div>
					<label
						htmlFor="quiz-duration"
						className="block font-medium mb-1 text-purple-700"
					>
						Duration (minutes)
					</label>
					<input
						id="quiz-duration"
						className="border rounded px-2 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-purple-400"
						type="number"
						min="1"
						value={duration}
						onChange={(e) => setDuration(e.target.value)}
						required
					/>
				</div>
				<div>
					<label
						htmlFor="passing_score"
						className="block font-medium mb-1 text-purple-700"
					>
						Passing score (Enter a percentage between 0 and 100.)
					</label>
					<input
						id="passing_score"
						className="border rounded px-2 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-purple-400"
						type="number"
						min="0"
						max="100"
						value={passScore}
						onChange={(e) => setPassingScore(e.target.value)}
						required
					/>
				</div>
				{error && <div className="text-red-500 text-sm">{error}</div>}
				<button type="submit" className="btn-primary" disabled={loading}>
					{loading ? "Creating..." : "Create Quiz"}
				</button>
			</form>
		</div>
	);
}

export default CreateQuiz;
