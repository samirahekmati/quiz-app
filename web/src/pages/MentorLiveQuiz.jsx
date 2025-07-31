import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";

import getApiBaseUrl from "../services/apiBaseUrl";
import { emitEvent, onEvent, offEvent } from "../services/socket";

import LiveQuizSection from "./LiveQuizSection";

function MentorLiveQuiz() {
	const { quizId } = useParams();
	const navigate = useNavigate();
	const mentorId = localStorage.getItem("currentMentorId");
	const [quizStarted, setQuizStarted] = useState(false);
	const [forceEndEnabled, setForceEndEnabled] = useState(false);
	const [timer, setTimer] = useState(null); // seconds left
	const [quizDetail, setQuizDetail] = useState(null); // Full quiz object with questions
	const [initialProgress, setInitialProgress] = useState({}); // Progress state on reconnect

	// Fetch quiz detail for duration and questions list
	useEffect(() => {
		async function fetchQuiz() {
			try {
				const res = await fetch(`${getApiBaseUrl()}/quizzes/${quizId}`);
				const data = await res.json();
				if (res.ok) {
					setQuizDetail(data);
				}
			} catch (error) {
				console.error("Error fetching quiz detail:", error);
			}
		}
		if (quizId) fetchQuiz();
	}, [quizId]);

	// Always join room on mount
	useEffect(() => {
		if (!quizId || !mentorId) return;
		emitEvent("mentor-runs-quiz", { quizId });
		emitEvent("join-room", { quizId, userId: mentorId, role: "mentor" });
		console.log("Mentor join-room emitted", { quizId, mentorId });
		// Listen for room-joined confirmation
		const handleRoomJoined = () =>
			console.log("Mentor joined room successfully");
		onEvent("room-joined", handleRoomJoined);
		return () => {
			offEvent("room-joined", handleRoomJoined);
		};
	}, [quizId, mentorId]);

	const handleStartQuiz = () => {
		if (!quizDetail) return;
		emitEvent("quiz-started", {
			quizId,
			startedAt: new Date().toISOString(),
			duration: quizDetail.duration,
		});
		setQuizStarted(true);
		setTimer(quizDetail.duration);
		setForceEndEnabled(true);
		console.log("Mentor started quiz", { quizId, duration: quizDetail.duration });
	};

	// Restore progress on reconnect
	useEffect(() => {
		const handleFullProgressUpdate = (data) => {
			if (data && Array.isArray(data.answers) && quizDetail?.questions) {
				const questionIndexMap = quizDetail.questions.reduce((acc, q, i) => {
					acc[q.id] = i + 1;
					return acc;
				}, {});

				const latestAnswers = data.answers.reduce((acc, ans) => {
					// Only keep the latest answer for each user
					if (
						!acc[ans.username] ||
						new Date(ans.submitted_at) >
							new Date(acc[ans.username].submitted_at)
					) {
						acc[ans.username] = ans;
					}
					return acc;
				}, {});

				const fullProgress = Object.entries(latestAnswers).reduce(
					(acc, [userId, ans]) => {
						const questionIndex = questionIndexMap[ans.question_id];
						if (questionIndex) {
							acc[userId] = {
								current: questionIndex,
								total: quizDetail.questions.length,
								status:
									questionIndex === quizDetail.questions.length
										? "completed"
										: "in-progress",
							};
						}
						return acc;
					},
					{},
				);

				setInitialProgress(fullProgress);
				console.log("[MentorLiveQuiz] Full progress hydrated:", fullProgress);
			}
		};

		onEvent("full-progress-update", handleFullProgressUpdate);

		return () => {
			offEvent("full-progress-update", handleFullProgressUpdate);
		};
	}, [quizDetail]);

	// Timer sync logic
	useEffect(() => {
		function handleTimerSync(data) {
			if (data && typeof data.duration === "number") {
				setTimer(data.duration);
				if (data.startedAt && !data.endedAt) {
					setQuizStarted(true);
					setForceEndEnabled(true);
				} else {
					setQuizStarted(false);
					setForceEndEnabled(false);
				}
			}
		}
		onEvent("timer-sync", handleTimerSync);
		// Emit timer-sync on mount (for refresh)
		emitEvent("timer-sync", { quizId });
		return () => {
			offEvent("timer-sync", handleTimerSync);
		};
	}, [quizId]);

	const handleForceEnd = () => {
		emitEvent("quiz-ended", {
			quizId,
			endedAt: new Date().toISOString(),
		});
		setForceEndEnabled(false);
	};

	return (
		<div className="max-w-2xl mx-auto p-8">
			<button
				className="mb-6 px-4 py-2 rounded bg-purple-500 text-white hover:bg-purple-700 transition font-semibold shadow"
				onClick={() => navigate("/mentor/dashboard")}
			>
				← Back
			</button>
			<h1 className="text-2xl font-bold mb-4 text-purple-800">
				Live Quiz Session for: {quizDetail?.title || "..."}
			</h1>
			{quizStarted && (
				<div className="mb-4 text-lg font-mono text-blue-700">
					Time left: {timer !== null ? timer : "-"}s
				</div>
			)}
			<div className="mb-4 flex gap-2">
				{!quizStarted && (
					<button
						className="px-4 py-2 bg-green-600 text-white rounded"
						onClick={handleStartQuiz}
					>
						Start Quiz
					</button>
				)}
				{quizStarted && forceEndEnabled && (
					<button
						className="px-4 py-2 bg-red-600 text-white rounded"
						onClick={handleForceEnd}
					>
						Force End
					</button>
				)}
			</div>
			<LiveQuizSection
				quizId={quizId}
				mentorId={mentorId}
				initialProgress={initialProgress}
			/>
		</div>
	);
}

export default MentorLiveQuiz;
