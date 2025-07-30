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
	// const timerInterval = useRef(null);
	const [duration, setDuration] = useState(600); // fallback duration

	// Fetch quiz detail for real duration
	useEffect(() => {
		async function fetchQuiz() {
			try {
				const res = await fetch(`${getApiBaseUrl()}/quizzes/${quizId}`);
				const data = await res.json();
				if (res.ok && data.duration) setDuration(data.duration);
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
		emitEvent("quiz-started", {
			quizId,
			startedAt: new Date().toISOString(),
			duration, // use real duration!
		});
		setQuizStarted(true);
		setTimer(duration);
		setForceEndEnabled(true);
		console.log("Mentor started quiz", { quizId, duration });
	};

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
				Live Quiz Session
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
			<LiveQuizSection quizId={quizId} mentorId={mentorId} />
		</div>
	);
}

export default MentorLiveQuiz;
