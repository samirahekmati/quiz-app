import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";

import getApiBaseUrl from "../services/apiBaseUrl";

function QuizEdit() {
	const { quizId } = useParams();
	const navigate = useNavigate();

	const [questions, setQuestions] = useState([]);
	const [questionText, setQuestionText] = useState("");
	const [questionType, setQuestionType] = useState("multiple-choice");
	const [correctAnswer, setCorrectAnswer] = useState("");
	const [optionFields, setOptionFields] = useState([
		{ text: "", is_correct: false },
		{ text: "", is_correct: false },
	]);
	const [editingQuestionId, setEditingQuestionId] = useState(null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	// Fetch quiz and questions from API
	useEffect(() => {
		async function fetchQuiz() {
			setLoading(true);
			setError("");
			try {
				const res = await fetch(`${getApiBaseUrl()}/quizzes/${quizId}`);
				const data = await res.json();
				if (!res.ok) {
					setError(data.message || "Failed to load quiz.");
					setQuestions([]);
				} else {
					setQuestions(data.questions || []);
				}
			} catch {
				setError("Network error. Please try again.");
				setQuestions([]);
			} finally {
				setLoading(false);
			}
		}
		if (quizId) fetchQuiz();
	}, [quizId]);

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

	const handleAddQuestion = async (e) => {
		e.preventDefault();
		setError("");
		if (!questionText.trim()) {
			setError("Question text is required.");
			return;
		}
		if (questionType === "multiple-choice") {
			const validOptions = optionFields.filter((opt) => opt.text.trim());
			if (validOptions.length < 2) {
				setError("At least two options are required.");
				return;
			}
			if (!validOptions.some((opt) => opt.is_correct)) {
				setError("At least one correct option is required.");
				return;
			}
		}
		if (questionType === "text" && !correctAnswer.trim()) {
			setError("Correct answer is required for text questions.");
			return;
		}
		setLoading(true);
		try {
			const url = editingQuestionId
				? `${getApiBaseUrl()}/quizzes/${quizId}/questions/${editingQuestionId}`
				: `${getApiBaseUrl()}/quizzes/${quizId}/questions`;
			const method = editingQuestionId ? "PUT" : "POST";
			const body =
				questionType === "multiple-choice"
					? {
							text: questionText.trim(),
							type: "multiple_choice",
							options: optionFields.map((opt) => ({
								text: opt.text.trim(),
								is_correct: !!opt.is_correct,
							})),
						}
					: {
							text: questionText.trim(),
							type: "fill_in_blank",
							options: [{ text: correctAnswer.trim(), is_correct: true }],
						};
			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.message || "Failed to save question.");
				setLoading(false);
				return;
			}
			// Success: refresh questions from API
			setQuestionText("");
			setQuestionType("multiple-choice");
			setCorrectAnswer("");
			resetOptionFields();
			setEditingQuestionId(null);
			// Fetch updated questions
			const quizRes = await fetch(`${getApiBaseUrl()}/quizzes/${quizId}`);
			const quizData = await quizRes.json();
			if (quizRes.ok) {
				setQuestions(quizData.questions || []);
			}
		} catch {
			setError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	};

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

	const handleCancelEdit = () => {
		setQuestionText("");
		setQuestionType("multiple-choice");
		setCorrectAnswer("");
		resetOptionFields();
		setEditingQuestionId(null);
	};

	const handleFinishQuiz = () => {
		navigate("/mentor/dashboard");
	};

	return (
		<div className="p-4 max-w-2xl mx-auto">
			<h1 className="text-2xl font-bold mb-4">Edit Quiz</h1>
			{error && <div className="text-red-600 text-sm mb-2">{error}</div>}
			{loading && (
				<div className="text-gray-500 text-sm mb-2">Loading quiz...</div>
			)}
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
			{/* Render questions list from API */}
			<div className="border p-4 rounded bg-gray-50 text-gray-600 text-center">
				{questions.length === 0 ? (
					<p className="mb-2 font-semibold">No questions yet.</p>
				) : (
					<>
						<div className="font-semibold mb-2">Questions</div>
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
											[{q.type}]
										</span>
									</div>
									<div className="flex gap-2">
										<button
											type="button"
											className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
											onClick={() => handleEditQuestion(q)}
										>
											Edit
										</button>
										<button
											type="button"
											className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
											onClick={async () => {
												const res = await fetch(
													`${getApiBaseUrl()}/quizzes/${quizId}/questions/${q.id}`,
													{
														method: "DELETE",
													},
												);
												if (res.ok)
													setQuestions(
														questions.filter((qq) => qq.id !== q.id),
													);
											}}
										>
											Delete
										</button>
									</div>
								</li>
							))}
						</ul>
					</>
				)}
			</div>
			<div className="flex gap-2 mt-6">
				<button
					onClick={handleFinishQuiz}
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
				>
					Finish
				</button>
				<button
					onClick={() => navigate("/mentor/dashboard")}
					className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
					type="button"
				>
					Back
				</button>
			</div>
		</div>
	);
}

export default QuizEdit;
