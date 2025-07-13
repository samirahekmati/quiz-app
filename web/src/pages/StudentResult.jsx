import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";

// Mock quiz data (should be replaced with API/backend later)
const mockQuiz = {
	id: 1,
	title: "JavaScript Basics",
	questions: [
		{
			id: 101,
			text: "What is the result of 2 + 2 in JavaScript?",
			type: "multiple-choice",
			options: [
				{ id: 1, text: "4", is_correct: true },
				{ id: 2, text: "22", is_correct: false },
				{ id: 3, text: "NaN", is_correct: false },
			],
		},
		{
			id: 102,
			text: "Which of these are JavaScript data types?",
			type: "multiple-choice",
			options: [
				{ id: 4, text: "String", is_correct: true },
				{ id: 5, text: "Boolean", is_correct: true },
				{ id: 6, text: "Float", is_correct: false },
			],
		},
		{
			id: 103,
			text: "What is the output of console.log(typeof null)?",
			type: "text",
			correct_answer: "object",
		},
	],
};

function StudentResult() {
	const { quizId } = useParams();
	const navigate = useNavigate();
	const [result, setResult] = useState(null);

	useEffect(() => {
		// MVP ONLY: Read answers from localStorage
		// In production, this will be replaced by API/backend call
		const data = localStorage.getItem(`quiz_answers_${quizId}`);
		if (!data) {
			setResult({ error: "No answers found for this quiz." });
			return;
		}
		const { answers } = JSON.parse(data);
		const quiz = mockQuiz; // In real app, fetch by quizId
		let correct = 0;
		let incorrect = 0;
		let unanswered = 0;
		quiz.questions.forEach((q) => {
			const ans = answers[q.id];
			if (ans === undefined) {
				unanswered++;
				return;
			}
			if (q.type === "multiple-choice") {
				const correctOption = q.options.find((opt) => opt.is_correct);
				if (Number(ans) === correctOption.id) {
					correct++;
				} else {
					incorrect++;
				}
			} else if (q.type === "text") {
				if (
					ans.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
				) {
					correct++;
				} else {
					incorrect++;
				}
			}
		});
		setResult({ correct, incorrect, unanswered });
	}, [quizId]);

	if (!result) {
		return <div className="p-4 text-center">Loading result...</div>;
	}
	if (result.error) {
		return <div className="p-4 text-center text-red-600">{result.error}</div>;
	}

	return (
		<div className="p-4 max-w-md mx-auto text-center">
			<h1 className="text-2xl font-bold mb-4">Quiz Result</h1>
			<div className="mb-2">
				Correct answers: <span className="font-bold">{result.correct}</span>
			</div>
			<div className="mb-2">
				Incorrect answers: <span className="font-bold">{result.incorrect}</span>
			</div>
			<div className="mb-2">
				Unanswered: <span className="font-bold">{result.unanswered}</span>
			</div>
			<button
				className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
				onClick={() => navigate("/student/join")}
			>
				Back to Join
			</button>
		</div>
	);
}

export default StudentResult;
