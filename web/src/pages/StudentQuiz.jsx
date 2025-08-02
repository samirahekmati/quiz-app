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
import { formatTime } from "../services/timeFormatter";

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
	const [selectedOptionId, setSelectedOptionId] = useState(null);
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

	const handleNext = (e) => {
		e.preventDefault();
		let newAnswers = { ...answers };
		if (question.type === "multiple_choice") {
			if (selectedOptionId === null) return; // Nothing selected
			newAnswers[question.id] = selectedOptionId;
		} else {
			if (!textAnswer.trim()) return;
			newAnswers[question.id] = textAnswer.trim();
		}
		setAnswers(newAnswers);
		setSelectedOptionId(null);
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
				navigate(`/student/result/${quizId}`, {
					state: { totalQuestions: questions.length },
				});
			}
		}
	};

	// Show waiting page if quiz not started
	if (!quizStarted) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-green-400 to-cyan-500 flex flex-col items-center justify-center p-4 text-black">
				{errorAlert}
				<div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-center">
					<h1 className="text-3xl font-bold mb-4">
						Quiz: {quiz?.title || "Loading..."}
					</h1>
					<br />
					<p className="text-lg mb-6">
						Waiting for the mentor to start the quiz.
						<br />
						Please stay on this page...
					</p>
					{/* Simple CSS spinner */}
					<div className="w-12 h-12 border-4 border-white border-t-transparent border-solid rounded-full animate-spin mx-auto"></div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-400 to-cyan-500 flex items-center justify-center p-4">
			<div className="w-full max-w-2xl">
				{errorAlert}
				<div className="bg-white rounded-2xl shadow-2xl p-8">
					<div className="flex justify-between items-center mb-4">
						<h1 className="text-2xl font-bold text-gray-800">
							{quiz.title}
						</h1>
						<div className="text-right font-mono text-xl text-gray-700 bg-gray-100 px-4 py-2 rounded-lg">
							{formatTime(timer)}
						</div>
					</div>

					{answerStatus && (
						<div className="text-green-600 text-sm mb-4 text-center p-2 bg-green-50 rounded-lg">
							{answerStatus}
						</div>
					)}
					<form onSubmit={handleNext} className="space-y-6">
						<div>
							<div className="font-semibold text-lg mb-2 text-gray-600">
								Question {current + 1} of {questions.length}
							</div>
							<div className="text-xl text-gray-800 mb-4 p-4 bg-gray-50 rounded-lg">
								{question.text}
							</div>
							{question.type === "multiple_choice" ? (
								<div className="space-y-3">
									{question.options.map((opt) => (
										<label
											key={opt.id}
											className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
												selectedOptionId === opt.id
													? "border-green-500 bg-green-50 ring-2 ring-green-500"
													: "border-gray-300 hover:border-green-400"
											}`}
										>
											<input
												type="radio"
												name="option"
												value={opt.id}
												checked={selectedOptionId === opt.id}
												onChange={() => setSelectedOptionId(opt.id)}
												className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300"
											/>
											<span className="text-gray-700">{opt.text}</span>
										</label>
									))}
								</div>
							) : (
								<input
									className="border-gray-300 border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
									value={textAnswer}
									onChange={(e) => setTextAnswer(e.target.value)}
									placeholder="Your answer"
									required
								/>
							)}
						</div>
						<button
							type="submit"
							className="w-full px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300 transform hover:scale-105"
						>
							{current < questions.length - 1 ? "Next Question" : "Finish Quiz"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}

export default StudentQuiz;
