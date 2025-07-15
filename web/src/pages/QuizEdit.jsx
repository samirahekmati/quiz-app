import { useState } from "react";
import { useParams, useNavigate } from "react-router";

// MVP ONLY: Load quizzes from localStorage or use empty array
// In production, fetch from backend/database
const loadQuizzes = () => {
	const saved = localStorage.getItem("quizzes");
	return saved ? JSON.parse(saved) : [];
};

function QuizEdit() {
	const { quizId } = useParams();
	const navigate = useNavigate();
	const currentMentorId = Number(localStorage.getItem("currentMentorId"));
	// Load quizzes (MVP ONLY)
	const [quizzes, setQuizzes] = useState(loadQuizzes());
	// Find current quiz (MVP ONLY)
	const quizIndex = quizzes.findIndex((q) => q.id === Number(quizId));
	// Always preserve user_id
	const quiz = quizzes[quizIndex] || {
		id: Number(quizId),
		user_id: currentMentorId,
		questions: [],
	};
	// State for all questions (nested in quiz)
	const [questions, setQuestions] = useState(quiz.questions || []);
	// State for current question form
	const [questionText, setQuestionText] = useState("");
	const [questionType, setQuestionType] = useState("multiple-choice");
	const [correctAnswer, setCorrectAnswer] = useState(""); // for text type
	// State for options (for multiple-choice): array of { text, is_correct }
	const [optionFields, setOptionFields] = useState([
		{ text: "", is_correct: false },
		{ text: "", is_correct: false },
	]);
	// State for editing (MVP ONLY)
	// In production, use backend PATCH/PUT for editing questions
	const [editingQuestionId, setEditingQuestionId] = useState(null);

	// Handle change for each option field
	const handleOptionChange = (idx, field, value) => {
		setOptionFields((prev) =>
			prev.map((opt, i) =>
				i === idx
					? { ...opt, [field]: field === "is_correct" ? value : value }
					: opt,
			),
		);
	};

	// Add a new empty option field (max 4)
	const handleAddOptionField = (e) => {
		e.preventDefault();
		if (optionFields.length < 4) {
			setOptionFields([...optionFields, { text: "", is_correct: false }]);
		}
	};

	// Reset option fields to 2 empty fields
	const resetOptionFields = () => {
		setOptionFields([
			{ text: "", is_correct: false },
			{ text: "", is_correct: false },
		]);
	};

	// Add or update question in questions list
	const handleAddQuestion = (e) => {
		e.preventDefault();
		if (!questionText.trim()) return;
		if (questionType === "text" && !correctAnswer.trim()) return;
		if (questionType === "multiple-choice") {
			const validOptions = optionFields.filter((opt) => opt.text.trim());
			if (
				validOptions.length < 2 ||
				!validOptions.some((opt) => opt.is_correct)
			)
				return;
			// Assign unique ids to options
			const questionId =
				editingQuestionId ||
				(questions.length ? Math.max(...questions.map((q) => q.id)) + 1 : 1);
			const optionsWithIds = validOptions.map((opt, idx) => ({
				id: idx + 1,
				question_id: Number(quizId), // MVP ONLY: In production, backend assigns ids
				text: opt.text,
				is_correct: opt.is_correct,
			}));
			const newQuestion = {
				id: questionId,
				quiz_id: Number(quizId),
				text: questionText,
				type: questionType,
				options: optionsWithIds,
			};
			let updatedQuestions;
			if (editingQuestionId) {
				// MVP ONLY: Update question in-place by id
				// In production, send PATCH/PUT to backend
				updatedQuestions = questions.map((q) =>
					q.id === editingQuestionId ? newQuestion : q,
				);
			} else {
				updatedQuestions = [...questions, newQuestion];
			}
			setQuestions(updatedQuestions);
			// Reset form
			setQuestionText("");
			setQuestionType("multiple-choice");
			setCorrectAnswer("");
			resetOptionFields();
			setEditingQuestionId(null);
		} else {
			// For text type
			const questionId =
				editingQuestionId ||
				(questions.length ? Math.max(...questions.map((q) => q.id)) + 1 : 1);
			const newQuestion = {
				id: questionId,
				quiz_id: Number(quizId),
				text: questionText,
				type: questionType,
				correct_answer: correctAnswer,
				options: [],
			};
			let updatedQuestions;
			if (editingQuestionId) {
				// MVP ONLY: Update question in-place by id
				// In production, send PATCH/PUT to backend
				updatedQuestions = questions.map((q) =>
					q.id === editingQuestionId ? newQuestion : q,
				);
			} else {
				updatedQuestions = [...questions, newQuestion];
			}
			setQuestions(updatedQuestions);
			// Reset form
			setQuestionText("");
			setQuestionType("multiple-choice");
			setCorrectAnswer("");
			resetOptionFields();
			setEditingQuestionId(null);
		}
	};

	// Edit question (load to form, do not remove from list)
	const handleEditQuestion = (q) => {
		setQuestionText(q.text);
		setQuestionType(q.type);
		setCorrectAnswer(q.correct_answer || "");
		if (q.type === "multiple-choice") {
			setOptionFields(
				q.options && q.options.length >= 2
					? q.options.map((opt) => ({
							text: opt.text,
							is_correct: opt.is_correct,
						}))
					: [
							{ text: "", is_correct: false },
							{ text: "", is_correct: false },
						],
			);
		} else {
			resetOptionFields();
		}
		setEditingQuestionId(q.id);
	};

	// Cancel editing
	const handleCancelEdit = () => {
		setQuestionText("");
		setQuestionType("multiple-choice");
		setCorrectAnswer("");
		resetOptionFields();
		setEditingQuestionId(null);
	};

	// Finish quiz: save quiz with questions/options to localStorage (MVP ONLY)
	// In production, send to backend/database
	const handleFinishQuiz = () => {
		const updatedQuiz = {
			...quiz,
			user_id: quiz.user_id || currentMentorId,
			questions,
		};
		let updatedQuizzes;
		if (quizIndex !== -1) {
			updatedQuizzes = quizzes.map((q, i) =>
				i === quizIndex ? updatedQuiz : q,
			);
		} else {
			// When creating a new quiz, add isRunning and isStarted fields (MVP ONLY)
			const newQuiz = {
				id: quizzes.length ? Math.max(...quizzes.map((q) => q.id)) + 1 : 1,
				user_id: currentMentorId,
				title: "New Quiz", // Placeholder, will be updated
				description: "Description for new quiz", // Placeholder, will be updated
				duration: 30 * 60, // Placeholder, will be updated
				questions: [],
				isRunning: false, // MVP ONLY: In production, backend should set this
				isStarted: false, // MVP ONLY: In production, backend should set this
			};
			updatedQuizzes = [...quizzes, newQuiz];
		}
		setQuizzes(updatedQuizzes);
		localStorage.setItem("quizzes", JSON.stringify(updatedQuizzes));
		// Redirect to dashboard
		navigate("/mentor/dashboard");
	};

	return (
		<div className="p-4 max-w-2xl mx-auto">
			<h1 className="text-2xl font-bold mb-4">Edit Quiz</h1>
			{/* Add Question Form */}
			<form
				onSubmit={handleAddQuestion}
				className="mb-8 space-y-4 border p-4 rounded"
			>
				<div>
					<label htmlFor="question-text" className="block font-medium mb-1">
						Question Text
					</label>
					<textarea
						id="question-text"
						className="border rounded px-2 py-1 w-full min-h-[60px]"
						value={questionText}
						onChange={(e) => setQuestionText(e.target.value)}
						required
					/>
				</div>
				<div>
					<label htmlFor="question-type" className="block font-medium mb-1">
						Type
					</label>
					<select
						id="question-type"
						className="border rounded px-2 py-1 w-full"
						value={questionType}
						onChange={(e) => setQuestionType(e.target.value)}
					>
						<option value="multiple-choice">Multiple Choice</option>
						<option value="text">Text</option>
					</select>
				</div>
				{/* If type is text, show correct answer input */}
				{questionType === "text" && (
					<div>
						<label htmlFor="correct-answer" className="block font-medium mb-1">
							Correct Answer
						</label>
						<input
							id="correct-answer"
							className="border rounded px-2 py-1 w-full"
							value={correctAnswer}
							onChange={(e) => setCorrectAnswer(e.target.value)}
							required
						/>
					</div>
				)}
				{/* If type is multiple-choice, show dynamic option fields */}
				{questionType === "multiple-choice" && (
					<div className="border rounded p-3 mb-2">
						<div className="font-medium mb-2">Options</div>
						<ul className="mb-2">
							{optionFields.map((opt, idx) => (
								<li key={idx} className="flex items-center gap-2 mb-1">
									<span>{String.fromCharCode(65 + idx)}.</span>
									<input
										className="border rounded px-2 py-1"
										value={opt.text}
										onChange={(e) =>
											handleOptionChange(idx, "text", e.target.value)
										}
										placeholder={`Option ${idx + 1}`}
										required
									/>
									<label className="flex items-center gap-1">
										<input
											type="checkbox"
											checked={opt.is_correct}
											onChange={(e) =>
												handleOptionChange(idx, "is_correct", e.target.checked)
											}
										/>
										Correct
									</label>
								</li>
							))}
						</ul>
						{/* Add Option button (max 4) */}
						{optionFields.length < 4 && (
							<button
								className="px-2 py-1 bg-gray-200 rounded"
								onClick={handleAddOptionField}
							>
								Add Option
							</button>
						)}
					</div>
				)}
				<div className="flex gap-2">
					<button
						type="submit"
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
					>
						{editingQuestionId ? "Save Changes" : "Save Question"}
					</button>
					{editingQuestionId && (
						<button
							type="button"
							className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
							onClick={handleCancelEdit}
						>
							Cancel
						</button>
					)}
				</div>
			</form>
			{/* List of questions */}
			<div>
				<div className="font-semibold mb-2">Questions</div>
				{questions.length === 0 ? (
					<p>No questions yet.</p>
				) : (
					<ul className="space-y-3">
						{questions.map((q, idx) => (
							<li
								key={q.id}
								className="border p-3 rounded flex justify-between items-center"
							>
								<div>
									<span className="font-bold mr-2">Q{idx + 1}:</span>
									<span>{q.text}</span>
									<span className="ml-2 text-xs text-gray-500">[{q.type}]</span>
								</div>
								<button
									className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
									onClick={() => handleEditQuestion(q)}
								>
									Edit
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
			{/* Finish Quiz button */}
			<button
				className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
				onClick={handleFinishQuiz}
			>
				Finish
			</button>
		</div>
	);
}

export default QuizEdit;
