import { useState } from "react";
import { useParams, useNavigate } from "react-router";

// Helper to load quizzes from localStorage
const loadQuizzes = () => {
	const saved = localStorage.getItem("quizzes");
	return saved ? JSON.parse(saved) : [];
};

function StudentQuiz() {
	const { quizId } = useParams();
	const navigate = useNavigate();
	// State for quiz started (simulate mentor start)
	const [quizStarted, setQuizStarted] = useState(false);
	// State for current question index
	const [current, setCurrent] = useState(0);
	// State for answers: { [questionId]: answer or array of answers }
	const [answers, setAnswers] = useState({});
	// State for text answer
	const [textAnswer, setTextAnswer] = useState("");
	// State for selected options (array for multiple correct)
	const [selectedOptions, setSelectedOptions] = useState([]);

	// Load quiz from localStorage
	const quizzes = loadQuizzes();
	const quiz = quizzes.find((q) => q.id === Number(quizId));
	if (!quiz) {
		return (
			<div className="p-4 text-center text-red-600">
				Quiz not found or invalid Quiz ID.
			</div>
		);
	}
	const questions = quiz.questions || [];
	const question = questions[current];
	// Detect if multiple correct answers
	const isMultiple =
		question.type === "multiple-choice" &&
		question.options.filter((o) => o.is_correct).length > 1;

	// Handle answer submit (Next)
	const handleNext = (e) => {
		e.preventDefault();
		let newAnswers = { ...answers };
		if (question.type === "multiple-choice") {
			if (isMultiple) {
				if (selectedOptions.length === 0) return; // must select at least one
				newAnswers[question.id] = selectedOptions;
			} else {
				if (selectedOptions.length !== 1) return; // must select one
				newAnswers[question.id] = selectedOptions[0];
			}
		} else {
			if (!textAnswer.trim()) return; // must enter
			newAnswers[question.id] = textAnswer.trim();
		}
		setAnswers(newAnswers);
		setSelectedOptions([]);
		setTextAnswer("");
		if (current < questions.length - 1) {
			setCurrent(current + 1);
		} else {
			// MVP ONLY: Save answers to localStorage for StudentResult.jsx
			// In production, this will be replaced by API/database call
			localStorage.setItem(
				`quiz_answers_${quiz.id}`,
				JSON.stringify({ quizId: quiz.id, answers: newAnswers }),
			);
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
