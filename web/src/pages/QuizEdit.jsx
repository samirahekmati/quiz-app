import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";

import getApiBaseUrl from "../services/apiBaseUrl";
import { updateQuiz } from "../services/quizService";

function QuizEdit() {
	const { quizId } = useParams();
	const navigate = useNavigate();

	// State variables for quiz info
	const [quizTitle, setQuizTitle] = useState("");
	const [quizDescription, setQuizDescription] = useState("");
	const [quizDuration, setQuizDuration] = useState(0);
	const [saving, setSaving] = useState(false);
	const [saveMsg, setSaveMsg] = useState("");

	// State variables for questions
	const [questions, setQuestions] = useState([]);
	const [questionText, setQuestionText] = useState("");
	const questionType = "multiple-choice";
	const [optionFields, setOptionFields] = useState([
		{ text: "", is_correct: false },
		{ text: "", is_correct: false },
	]);
	const [editingQuestionId, setEditingQuestionId] = useState(null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	// Add a derived state for minutes
	const [quizDurationMinutes, setQuizDurationMinutes] = useState(
		Math.round((quizDuration || 0) / 60),
	);

	// Sync minutes when quizDuration changes
	useEffect(() => {
		setQuizDurationMinutes(Math.round((quizDuration || 0) / 60));
	}, [quizDuration]);

	// Update quizDuration (in seconds) when minutes input changes
	const handleDurationMinutesChange = (e) => {
		const minutes = Number(e.target.value);
		setQuizDurationMinutes(minutes);
		setQuizDuration(minutes * 60);
	};

	const handleQuizUpdate = async (e) => {
		e.preventDefault();
		setSaving(true);
		setSaveMsg("");
		try {
			const token = localStorage.getItem("token");
			await updateQuiz(token, quizId, {
				title: quizTitle,
				description: quizDescription,
				duration: quizDuration,
			});
			setSaveMsg("Quiz updated successfully!");
		} catch {
			setSaveMsg("Failed to update quiz.");
		}
		setSaving(false);
	};

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
					setQuizTitle(data.title || "");
					setQuizDescription(data.description || "");
					setQuizDuration(data.duration || 0);
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
		if (field === "is_correct" && value === true) {
			// If a checkbox is checked, uncheck all others
			setOptionFields((prev) =>
				prev.map((opt, i) => ({
					...opt,
					is_correct: i === idx,
				})),
			);
		} else {
			// Handle text change or unchecking
			setOptionFields((prev) =>
				prev.map((opt, i) =>
					i === idx ? { ...opt, [field]: value } : opt,
				),
			);
		}
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

		const validOptions = optionFields.filter((opt) => opt.text.trim());
		if (validOptions.length < 2) {
			setError("At least two options are required.");
			return;
		}
		if (!validOptions.some((opt) => opt.is_correct)) {
			setError("At least one correct option is required.");
			return;
		}
		setLoading(true);
		try {
			const url = editingQuestionId
				? `${getApiBaseUrl()}/quizzes/${quizId}/questions/${editingQuestionId}`
				: `${getApiBaseUrl()}/quizzes/${quizId}/questions`;
			const method = editingQuestionId ? "PUT" : "POST";
			const body = {
				text: questionText.trim(),
				type: "multiple_choice",
				options: optionFields.map((opt) => ({
					text: opt.text.trim(),
					is_correct: !!opt.is_correct,
				})),
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

		setEditingQuestionId(q.id);
	};

	const handleCancelEdit = () => {
		setQuestionText("");
		resetOptionFields();
		setEditingQuestionId(null);
	};

	// Delete a question by ID
	const handleDeleteQuestion = async (questionId) => {
		if (!window.confirm("Are you sure you want to delete this question?"))
			return;
		try {
			const res = await fetch(
				`${getApiBaseUrl()}/quizzes/${quizId}/questions/${questionId}`,
				{
					method: "DELETE",
				},
			);
			if (!res.ok) {
				alert("Failed to delete question.");
				return;
			}
			setQuestions((prev) => prev.filter((q) => q.id !== questionId));
		} catch {
			alert("Network error. Please try again.");
		}
	};

	return (
		<div className="max-w-2xl mx-auto">
			<button
				onClick={() => navigate(`/mentor/quiz/${quizId}`)}
				className="mb-6 px-4 py-2 rounded bg-purple-500 text-white hover:bg-purple-700 transition font-semibold shadow"
				type="button"
			>
				← Back to Quiz
			</button>
			<div className="p-8 bg-purple-100 rounded-2xl shadow-lg border-t-4 border-purple-500">
				{/* Quiz Edit Section */}
				<h1 className="text-2xl font-bold mb-6 text-purple-800">Edit Quiz</h1>
				{error && <div className="text-red-600 text-sm mb-2">{error}</div>}
				{loading && (
					<div className="text-purple-500 text-sm mb-2">Loading quiz...</div>
				)}
				{/* Quiz Edit Form */}
				<section className="mb-10">
					<form
						onSubmit={handleQuizUpdate}
						className="p-6 bg-white rounded-xl shadow border border-purple-200"
					>
						<h2 className="text-lg font-semibold mb-4 text-purple-700">
							Quiz Details
						</h2>
						<div className="mb-4">
							<label
								htmlFor="quiz-title"
								className="block mb-1 text-purple-700"
							>
								Title
							</label>
							<input
								id="quiz-title"
								value={quizTitle}
								onChange={(e) => setQuizTitle(e.target.value)}
								className="w-full p-2 border rounded bg-purple-50 border-purple-200"
								required
							/>
						</div>
						<div className="mb-4">
							<label
								htmlFor="quiz-description"
								className="block mb-1 text-purple-700"
							>
								Description
							</label>
							<textarea
								id="quiz-description"
								value={quizDescription}
								onChange={(e) => setQuizDescription(e.target.value)}
								className="w-full p-2 border rounded  bg-purple-50 border-purple-200"
								required
							/>
						</div>
						<div className="mb-4">
							<label
								htmlFor="quiz-duration"
								className="block mb-1 text-purple-700"
							>
								Duration (minutes)
							</label>
							<input
								id="quiz-duration"
								type="number"
								value={quizDurationMinutes}
								onChange={handleDurationMinutesChange}
								className="w-full p-2 border rounded  bg-purple-50 border-purple-200"
								required
								min={1}
							/>
						</div>
						<button
							type="submit"
							className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
							disabled={saving}
						>
							{saving ? "Saving..." : "Save"}
						</button>
						{saveMsg && (
							<p className="mt-2 text-sm text-purple-700">{saveMsg}</p>
						)}
					</form>
				</section>
				{/* Question Form Section */}
				<section>
					<h2 className="text-lg font-semibold mb-4 text-purple-700">
						Questions
					</h2>
					{/* Add Question Form */}
					<form
						onSubmit={handleAddQuestion}
						className="mb-8 space-y-4 bg-white p-6 rounded-xl shadow border border-purple-200"
					>
						<div>
							<label
								htmlFor="question-text"
								className="block font-medium mb-1 text-purple-700"
							>
								Question Text
							</label>
							<textarea
								id="question-text"
								className="border rounded px-2 py-1 w-full min-h-[60px] bg-purple-50 border-purple-200"
								value={questionText}
								onChange={(e) => setQuestionText(e.target.value)}
								required
							/>
						</div>
						<div>
							<label
								htmlFor="options"
								className="block font-medium mb-1 text-purple-700"
							>
								Options
							</label>
						</div>

						{questionType === "multiple-choice" && (
							<div className="border rounded p-3 mb-2 bg-purple-50 border-purple-200">
								<ul className="mb-2">
									{optionFields.map((opt, idx) => (
										<li key={idx} className="flex items-center gap-2 mb-1">
											<span>{String.fromCharCode(65 + idx)}.</span>
											<input
												className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
												value={opt.text}
												onChange={(e) =>
													handleOptionChange(idx, "text", e.target.value)
												}
												placeholder={`Option ${idx + 1}`}
												required
											/>
											<label className="flex items-center gap-1 text-purple-700">
												<input
													type="checkbox"
													checked={opt.is_correct}
													onChange={(e) =>
														handleOptionChange(
															idx,
															"is_correct",
															e.target.checked,
														)
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
										className="px-2 py-1 bg-purple-400 text-white rounded hover:bg-purple-500 transition"
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
								className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
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
				</section>
				{/* Render questions list from API */}
				<div className="border p-4 rounded bg-purple-50 text-purple-700 text-center border-purple-200">
					{questions.length === 0 ? (
						<p className="mb-2 font-semibold">No questions yet.</p>
					) : (
						<>
							<div className="font-semibold mb-2 text-purple-800">
								Questions
							</div>
							<ul className="space-y-3">
								{questions.map((q, idx) => (
									<li
										key={q.id}
										className="border p-3 rounded flex justify-between items-center bg-white border-purple-200"
									>
										<div>
											<span className="font-bold mr-2 text-purple-800">
												Q{idx + 1}:
											</span>
											<span>{q.text}</span>
											<span className="ml-2 text-xs text-purple-400">
												[{q.type}]
											</span>
										</div>
										<div className="flex gap-2">
											<button
												type="button"
												className="px-2 py-1 bg-purple-400 text-white rounded hover:bg-purple-500 text-sm transition"
												onClick={() => handleEditQuestion(q)}
											>
												Edit
											</button>
											<button
												type="button"
												className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-600 text-sm transition"
												onClick={() => handleDeleteQuestion(q.id)}
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
			</div>
		</div>
	);
}

export default QuizEdit;
