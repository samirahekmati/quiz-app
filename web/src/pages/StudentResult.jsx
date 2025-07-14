import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";

// Helper to load quizzes from localStorage
const loadQuizzes = () => {
	const saved = localStorage.getItem("quizzes");
	return saved ? JSON.parse(saved) : [];
};

function StudentResult() {
	const { quizId } = useParams();
	const navigate = useNavigate();
	const [result, setResult] = useState(null);

	useEffect(() => {
		const data = localStorage.getItem(`quiz_answers_${quizId}`);
		if (!data) {
			setResult({ error: "No answers found for this quiz." });
			return;
		}
		const { answers } = JSON.parse(data);
		const quizzes = loadQuizzes();
		const quiz = quizzes.find((q) => q.id === Number(quizId));
		if (!quiz) {
			setResult({ error: "Quiz not found." });
			return;
		}
		let correct = 0;
		let incorrect = 0;
		let unanswered = 0;
		(quiz.questions || []).forEach((q) => {
			const ans = answers[q.id];
			if (ans === undefined) {
				unanswered++;
				return;
			}
			if (q.type === "multiple-choice") {
				const correctOptions = (q.options || [])
					.filter((opt) => opt.is_correct)
					.map((opt) => opt.id)
					.sort();
				if (Array.isArray(ans)) {
					const ansArr = ans.map(Number).sort();
					if (
						correctOptions.length === ansArr.length &&
						correctOptions.every((id, idx) => id === ansArr[idx])
					) {
						correct++;
					} else {
						incorrect++;
					}
				} else {
					if (
						Number(ans) === correctOptions[0] &&
						correctOptions.length === 1
					) {
						correct++;
					} else {
						incorrect++;
					}
				}
			} else if (q.type === "text") {
				if (
					ans.trim().toLowerCase() ===
					(q.correct_answer || "").trim().toLowerCase()
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
