import { useState } from "react";
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

function StudentQuiz() {
	const { quizId } = useParams();
	const navigate = useNavigate();
	// State for quiz started (simulate mentor start)
	const [quizStarted, setQuizStarted] = useState(false);
	// State for current question index
	const [current, setCurrent] = useState(0);
	// State for answers: { [questionId]: answer }
	const [answers, setAnswers] = useState({});
	// State for text answer
	const [textAnswer, setTextAnswer] = useState("");
	// State for selected option (for multiple-choice)
	const [selectedOption, setSelectedOption] = useState(null);

	// Check if quizId matches mockQuiz.id (MVP only)
	if (Number(quizId) !== mockQuiz.id) {
		return (
			<div className="p-4 text-center text-red-600">
				Quiz not found or invalid Quiz ID.
			</div>
		);
	}

	// Get quiz data (mock)
	const quiz = mockQuiz; // In real app, fetch by quizId
	const questions = quiz.questions;
	const question = questions[current];

	// Handle answer submit (Next)
	const handleNext = (e) => {
		e.preventDefault();
		// Save answer
		if (question.type === "multiple-choice") {
			if (selectedOption == null) return; // must select
			setAnswers((prev) => ({ ...prev, [question.id]: selectedOption }));
		} else {
			if (!textAnswer.trim()) return; // must enter
			setAnswers((prev) => ({ ...prev, [question.id]: textAnswer.trim() }));
		}
		// Reset answer state for next question
		setSelectedOption(null);
		setTextAnswer("");
		// Go to next question or finish
		if (current < questions.length - 1) {
			setCurrent(current + 1);
		} else {
			// MVP ONLY: Save answers to localStorage for StudentResult.jsx
			// In production, this will be replaced by API/database call
			localStorage.setItem(
				`quiz_answers_${quiz.id}`,
				JSON.stringify({ quizId: quiz.id, answers }),
			);
			// All questions answered, redirect to result
			navigate(`/student/result/${quiz.id}`);
		}
	};

	// If quiz not started, show waiting message and simulate button
	if (!quizStarted) {
		return (
			<div className="p-4 max-w-md mx-auto text-center">
				<h1 className="text-2xl font-bold mb-4">Quiz: {quiz.title}</h1>
				<div className="text-lg mb-2">
					Waiting for the mentor to start the quiz. Please stay on this page...{" "}
					<span role="img" aria-label="traffic light">
						🚦
					</span>
				</div>
				{/* MVP only: Simulate mentor start button. Remove in production! */}
				<button
					className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
					onClick={() => setQuizStarted(true)}
				>
					Simulate Mentor Start
				</button>
			</div>
		);
	}

	// Quiz started: show current question
	return (
		<div className="p-4 max-w-md mx-auto">
			<h1 className="text-2xl font-bold mb-4">Quiz: {quiz.title}</h1>
			<form onSubmit={handleNext} className="space-y-4 border p-4 rounded">
				<div>
					<div className="font-medium mb-2">
						Question {current + 1} of {questions.length}
					</div>
					<div className="mb-2">{question.text}</div>
					{question.type === "multiple-choice" ? (
						<div className="space-y-2">
							{question.options.map((opt) => (
								<label key={opt.id} className="flex items-center gap-2">
									<input
										type="radio"
										name="option"
										value={opt.id}
										checked={selectedOption === opt.id}
										onChange={() => setSelectedOption(opt.id)}
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
