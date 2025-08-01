import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";

import getApiBaseUrl from "../services/apiBaseUrl";
import {
	connectSocket,
	emitEvent,
	onEvent,
	offEvent,
	registerReconnectHandler,
} from "../services/socket";

function StudentQuiz() {
	const { quizId } = useParams();
	const navigate = useNavigate();
	const [quiz, setQuiz] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showError, setShowError] = useState(false);
	const [current, setCurrent] = useState(0);
	const [answers, setAnswers] = useState({});
	const [textAnswer, setTextAnswer] = useState("");
	const [selectedOptions, setSelectedOptions] = useState([]);
	// Real-time timer state
	const [timer, setTimer] = useState(null); // seconds left
	const [quizStarted, setQuizStarted] = useState(false);
	const [answerStatus, setAnswerStatus] = useState(""); // confirmation message

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

	useEffect(() => {
		// Connect socket if not already connected
		connectSocket({
			userId: localStorage.getItem("studentUsername") || "",
			role: "student",
		});

		// Join quiz room (if not already joined)
		emitEvent("join-room", {
			quizId,
			userId: localStorage.getItem("studentUsername") || "",
			role: "student",
		});

		// Reconnect handling: on connect/reconnect, re-emit join-room and timer-sync
		registerReconnectHandler(() => {
			emitEvent("join-room", {
				quizId,
				userId: localStorage.getItem("studentUsername") || "",
				role: "student",
			});
			emitEvent("timer-sync", { quizId });
		});

		// Listen for quiz-started event
		const handleQuizStarted = (data) => {
			setQuizStarted(true);
			setTimer(data.duration);
		};
		onEvent("quiz-started", handleQuizStarted);

		// Listen for quiz-ended event
		const handleQuizEnded = () => {
			setQuizStarted(false);
			setTimer(0);
			navigate(`/student/result/${quizId}`);
		};
		onEvent("quiz-ended", handleQuizEnded);

		const handleQuizHasEnded = () => {
			navigate(`/student/result/${quizId}`);
		};
		onEvent("quiz-has-ended", handleQuizHasEnded);

		// Listen for timer-sync event
		const handleTimerSync = (data) => {
			if (data && typeof data.duration === "number") {
				setTimer(data.duration);

				if (data.startedAt && !data.endedAt) {
					setQuizStarted(true);
				}
			}
		};
		onEvent("timer-sync", handleTimerSync);

		// Listen for student-progress-update event (on reconnect)
		const handleStudentProgressUpdate = (data) => {
			if (data && Array.isArray(data.answers)) {
				const receivedAnswers = {};
				data.answers.forEach((ans) => {
					receivedAnswers[ans.question_id] = ans.selected_option;
				});
				setAnswers(receivedAnswers);
				// Set current question to the one after the last answered one
				const lastAnsweredIndex = quiz?.questions.findIndex(
					(q) => q.id === data.answers[data.answers.length - 1]?.question_id,
				);
				if (
					lastAnsweredIndex !== -1 &&
					lastAnsweredIndex < quiz?.questions.length - 1
				) {
					setCurrent(lastAnsweredIndex + 1);
				} else if (lastAnsweredIndex === quiz?.questions.length - 1) {
					setCurrent(lastAnsweredIndex);
				}
				console.log(
					"[StudentQuiz] Student progress hydrated:",
					receivedAnswers,
				);
			}
		};
		onEvent("student-progress-update", handleStudentProgressUpdate);

		// Listen for answer-received event
		const handleAnswerReceived = () => {
			setAnswerStatus("Answer submitted successfully!");
			setTimeout(() => setAnswerStatus(""), 2000);
		};
		onEvent("answer-received", handleAnswerReceived);

		// Listen for error event
		const handleError = (err) => {
			setError(err.message || "An error occurred.");
			setShowError(true);
			setTimeout(() => setShowError(false), 4000);
		};
		onEvent("error", handleError);

		// Cleanup listeners on unmount
		return () => {
			offEvent("quiz-started", handleQuizStarted);
			offEvent("quiz-ended", handleQuizEnded);
			offEvent("quiz-has-ended", handleQuizHasEnded);
			offEvent("timer-sync", handleTimerSync);
			offEvent("student-progress-update", handleStudentProgressUpdate);
			offEvent("answer-received", handleAnswerReceived);
			offEvent("error", handleError);
		};
	}, [quizId, navigate, quiz?.questions]);

	if (loading) {
		return <div className="p-4 text-center">Loading quiz...</div>;
	}
	// Show error alert at the top (dismissable)
	const errorAlert = showError && error && (
		<div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded flex items-center justify-between">
			<span>{error}</span>
			<button
				className="ml-4 text-red-700 font-bold px-2"
				onClick={() => setShowError(false)}
				aria-label="Dismiss error"
			>
				×
			</button>
		</div>
	);
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
		// Debug log for answer submission
		console.log("submit-answer emit", {
			quizId,
			userId: localStorage.getItem("studentUsername") || "",
			questionId: question.id,
			answer: newAnswers[question.id],
		});
		// Emit answer via socket.io
		emitEvent("submit-answer", {
			quizId,
			userId: localStorage.getItem("studentUsername") || "",
			questionId: question.id,
			answer: newAnswers[question.id],
			// Add progress info for mentor view
			questionIndex: current + 1,
			totalQuestions: questions.length,
		});
		if (current < questions.length - 1) {
			setCurrent(current + 1);
		} else {
			// On last question, ask for confirmation to finish
			const isFinished = window.confirm(
				"Are you sure you want to finish the quiz?",
			);
			if (isFinished) {
				navigate(`/student/result/${quizId}`);
			}
		}
	};

	// Show waiting page if quiz not started
	if (!quizStarted) {
		return (
			<div className="p-4 max-w-md mx-auto text-center">
				{errorAlert}
				<h1 className="text-2xl font-bold mb-4">Quiz: {quiz.title}</h1>
				<div className="text-lg mb-2">
					Waiting for the mentor to start the quiz. Please stay on this page...
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 max-w-md mx-auto">
			{errorAlert}
			<h1 className="text-2xl font-bold mb-4">Quiz: {quiz.title}</h1>
			<div className="mb-2 text-right font-mono">
				Time left: {timer !== null ? timer : "-"}s
			</div>
			{answerStatus && (
				<div className="text-green-600 text-sm mb-2">{answerStatus}</div>
			)}
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
