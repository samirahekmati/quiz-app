import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";

import getApiBaseUrl from "../services/apiBaseUrl";

function StudentQuiz() {
	const { quizId } = useParams();
	const navigate = useNavigate();
	const [quiz, setQuiz] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [current, setCurrent] = useState(0);
	const [answers, setAnswers] = useState({});
	const [textAnswer, setTextAnswer] = useState("");
	const [selectedOptions, setSelectedOptions] = useState([]);

	useEffect(() => {
		async function fetchQuiz() {
			setLoading(true);
			setError("");
			try {
				const res = await fetch(`${getApiBaseUrl()}/quizzes/${quizId}`);
				const data = await res.json();
				if (!res.ok) {
					setError(data.message || "Quiz not found or invalid Quiz ID.");
					setQuiz(null);
				} else {
					setQuiz(data);
				}
			} catch {
				setError("Network error. Please try again.");
				setQuiz(null);
			} finally {
				setLoading(false);
			}
		}
		if (quizId) fetchQuiz();
	}, [quizId]);

	if (loading) {
		return <div className="p-4 text-center">Loading quiz...</div>;
	}
	if (error) {
		return <div className="p-4 text-center text-red-600">{error}</div>;
	}
	if (!quiz) {
		return <div className="p-4 text-center text-red-600">Quiz not found.</div>;
	}

	const questions = quiz.questions || [];
	const question = questions[current];
	if (!question) {
		return <div className="p-4 text-center">No questions in this quiz.</div>;
	}
	const isMultiple =
		question.type === "multiple_choice" &&
		question.options.filter((o) => o.is_correct).length > 1;

	// TODO: Replace with API call to submit answer when backend endpoint is available
	const handleNext = (e) => {
		e.preventDefault();
		let newAnswers = { ...answers };
		if (question.type === "multiple_choice") {
			if (isMultiple) {
				if (selectedOptions.length === 0) return;
				newAnswers[question.id] = selectedOptions;
			} else {
				if (selectedOptions.length !== 1) return;
				newAnswers[question.id] = selectedOptions[0];
			}
		} else {
			if (!textAnswer.trim()) return;
			newAnswers[question.id] = textAnswer.trim();
		}
		setAnswers(newAnswers);
		setSelectedOptions([]);
		setTextAnswer("");
		if (current < questions.length - 1) {
			setCurrent(current + 1);
		} else {
			// TODO: POST /api/quizzes/:quizId/answers with { studentId, answers } when backend endpoint is available
			//
			// const studentId = localStorage.getItem("studentId");
			// const res = await fetch(`${getApiBaseUrl()}/quizzes/${quizId}/answers`, {
			//   method: "POST",
			//   headers: { "Content-Type": "application/json" },
			//   body: JSON.stringify({ studentId, answers: newAnswers }),
			// });
			// if (res.ok) {
			//   navigate(`/student/result/${quizId}`);
			// } else {
			//   // handle error
			// }
			navigate(`/student/result/${quiz.id}`);
		}
	};

	if (!quiz.isStarted) {
		return (
			<div className="p-4 max-w-md mx-auto text-center">
				<h1 className="text-2xl font-bold mb-4">Quiz: {quiz.title}</h1>
				<div className="text-lg mb-2">
					Waiting for the mentor to start the quiz. Please stay on this page...{" "}
					<span role="img" aria-label="traffic light">
						6a6
					</span>
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 max-w-md mx-auto">
			<h1 className="text-2xl font-bold mb-4">Quiz: {quiz.title}</h1>
			<form onSubmit={handleNext} className="space-y-4 border p-4 rounded">
				<div>
					<div className="font-medium mb-2">
						Question {current + 1} of {questions.length}
					</div>
					<div className="mb-2">{question.text}</div>
					{question.type === "multiple_choice" ? (
						<div className="space-y-2">
							{isMultiple
								? question.options.map((opt) => (
										<label key={opt.id} className="flex items-center gap-2">
											<input
												type="checkbox"
												checked={selectedOptions.includes(opt.id)}
												onChange={() => {
													setSelectedOptions((prev) =>
														prev.includes(opt.id)
															? prev.filter((id) => id !== opt.id)
															: [...prev, opt.id],
													);
												}}
											/>
											{opt.text}
										</label>
									))
								: question.options.map((opt) => (
										<label key={opt.id} className="flex items-center gap-2">
											<input
												type="radio"
												name="option"
												value={opt.id}
												checked={selectedOptions[0] === opt.id}
												onChange={() => setSelectedOptions([opt.id])}
											/>
											{opt.text}
										</label>
									))}
						</div>
					) : (
						<input
							className="border rounded px-2 py-1 w-full"
							value={textAnswer}
							onChange={(e) => setTextAnswer(e.target.value)}
							placeholder="Your answer"
							required
						/>
					)}
				</div>
				<button
					type="submit"
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
				>
					{current < questions.length - 1 ? "Next" : "Finish"}
				</button>
			</form>
		</div>
	);
}

export default StudentQuiz;
