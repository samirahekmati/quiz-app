import { useState } from "react";

// Supported question types
const QUESTION_TYPES = [
	{ value: "multiple-choice", label: "Multiple Choice" },
	{ value: "text", label: "Text" },
];

const DIFFICULTY_LEVELS = [
	{ value: "1", label: "Easy" },
	{ value: "2", label: "Medium" },
	{ value: "3", label: "Hard" },
];

function QuizEdit() {
	// State for all questions
	const [questions, setQuestions] = useState([]);
	// State for current question form
	const [questionText, setQuestionText] = useState("");
	const [questionType, setQuestionType] = useState(QUESTION_TYPES[0].value);
	const [difficulty, setDifficulty] = useState(DIFFICULTY_LEVELS[0].value);
	const [correctAnswer, setCorrectAnswer] = useState(""); // for text type
	// State for options (for multiple-choice): array of { text, is_correct }
	const [optionFields, setOptionFields] = useState([
		{ text: "", is_correct: false },
		{ text: "", is_correct: false },
	]);

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

	// Add question to questions list
	const handleAddQuestion = (e) => {
		e.preventDefault();
		if (!questionText.trim()) return;
		// For text type, need correctAnswer
		if (questionType === "text" && !correctAnswer.trim()) return;
		// For multiple-choice, need at least 2 options with text and at least one correct
		if (questionType === "multiple-choice") {
			const validOptions = optionFields.filter((opt) => opt.text.trim());
			if (
				validOptions.length < 2 ||
				!validOptions.some((opt) => opt.is_correct)
			)
				return;
			const newQuestion = {
				id: questions.length ? questions[questions.length - 1].id + 1 : 1,
				text: questionText,
				type: questionType,
				difficulty,
				options: validOptions,
			};
			setQuestions([...questions, newQuestion]);
			// Reset form
			setQuestionText("");
			setQuestionType(QUESTION_TYPES[0].value);
			setDifficulty(DIFFICULTY_LEVELS[0].value);
			resetOptionFields();
		} else {
			// For text type
			const newQuestion = {
				id: questions.length ? questions[questions.length - 1].id + 1 : 1,
				text: questionText,
				type: questionType,
				difficulty,
				correct_answer: correctAnswer,
			};
			setQuestions([...questions, newQuestion]);
			// Reset form
			setQuestionText("");
			setQuestionType(QUESTION_TYPES[0].value);
			setDifficulty(DIFFICULTY_LEVELS[0].value);
			setCorrectAnswer("");
			resetOptionFields();
		}
	};

	// Edit question (simple: load to form)
	const handleEditQuestion = (q) => {
		setQuestionText(q.text);
		setQuestionType(q.type);
		setDifficulty(q.difficulty);
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
		// Remove from list (will re-add on save)
		setQuestions(questions.filter((qq) => qq.id !== q.id));
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
						{QUESTION_TYPES.map((t) => (
							<option key={t.value} value={t.value}>
								{t.label}
							</option>
						))}
					</select>
				</div>
				<div>
					<label htmlFor="difficulty" className="block font-medium mb-1">
						Difficulty
					</label>
					<select
						id="difficulty"
						className="border rounded px-2 py-1 w-full"
						value={difficulty}
						onChange={(e) => setDifficulty(e.target.value)}
					>
						{DIFFICULTY_LEVELS.map((d) => (
							<option key={d.value} value={d.value}>
								{d.label}
							</option>
						))}
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
				<button
					type="submit"
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
				>
					Save Question
				</button>
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
									<span className="ml-2 text-xs text-gray-500">
										[{q.type}, Difficulty: {q.difficulty}]
									</span>
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
		</div>
	);
}

export default QuizEdit;
