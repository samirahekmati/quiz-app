import PropTypes from "prop-types";
import { useEffect, useState } from "react";

import {
	connectSocket,
	emitEvent,
	onEvent,
	offEvent,
	registerReconnectHandler,
} from "../services/socket";

function LiveQuizSection({ quizId, mentorId }) {
	// State for students, progress, quiz status, and error
	const [students, setStudents] = useState([]);
	const [roomUsersError, setRoomUsersError] = useState("");
	const [progress, setProgress] = useState({});
	const [quizStatusMsg, setQuizStatusMsg] = useState("");
	const [quizError, setQuizError] = useState("");
	const [showQuizError, setShowQuizError] = useState(false);

	// Connect socket and join quiz room when quizId changes
	useEffect(() => {
		if (!quizId || !mentorId) return;
		connectSocket({ userId: mentorId, role: "mentor" });
		emitEvent("join-room", { quizId, userId: mentorId, role: "mentor" });
		emitEvent("get-room-users", { quizId });
		// Listen for room-users event
		const handleRoomUsers = (data) => {
			console.log("[LiveQuizSection] room-users event:", data);
			if (data && Array.isArray(data.users)) {
				setStudents(data.users.filter((u) => u.role === "student"));
				setRoomUsersError("");
			} else {
				setRoomUsersError("Failed to fetch students in room.");
			}
		};
		const handleRoomUsersError = (err) => {
			setRoomUsersError(err.message || "Error fetching room users.");
		};
		onEvent("room-users", handleRoomUsers);
		onEvent("error", handleRoomUsersError);
		// Listen for progress-update event (live student answers)
		const handleProgressUpdate = (data) => {
			console.log("[LiveQuizSection] progress-update event:", data);
			if (!data || !data.userId || !data.questionId) return;
			setProgress((prev) => {
				const userProgress = prev[data.userId] || {};
				return {
					...prev,
					[data.userId]: {
						...userProgress,
						[data.questionId]: {
							answer: data.answer,
							timestamp: data.timestamp,
						},
					},
				};
			});
		};
		onEvent("progress-update", handleProgressUpdate);
		// Listen for quiz-started event
		const handleQuizStarted = (data) => {
			setQuizStatusMsg(
				"Quiz started at " +
					(data?.startedAt
						? new Date(data.startedAt).toLocaleTimeString()
						: "now"),
			);
		};
		// Listen for quiz-ended event
		const handleQuizEnded = (data) => {
			setQuizStatusMsg(
				"Quiz ended at " +
					(data?.endedAt ? new Date(data.endedAt).toLocaleTimeString() : "now"),
			);
		};
		// Listen for error event
		const handleQuizError = (err) => {
			setQuizError(err.message || "An error occurred.");
			setShowQuizError(true);
			setTimeout(() => setShowQuizError(false), 4000);
		};
		onEvent("quiz-started", handleQuizStarted);
		onEvent("quiz-ended", handleQuizEnded);
		onEvent("error", handleQuizError);
		// Reconnect handling: on connect/reconnect, re-emit join-room and get-room-users
		registerReconnectHandler(() => {
			emitEvent("join-room", { quizId, userId: mentorId, role: "mentor" });
			emitEvent("get-room-users", { quizId });
		});
		// Cleanup listeners on unmount or quiz change
		return () => {
			offEvent("room-users", handleRoomUsers);
			offEvent("error", handleRoomUsersError);
			offEvent("progress-update", handleProgressUpdate);
			offEvent("quiz-started", handleQuizStarted);
			offEvent("quiz-ended", handleQuizEnded);
			offEvent("error", handleQuizError);
		};
	}, [quizId, mentorId]);

	return (
		<div className="mt-4 border p-4 rounded bg-gray-50">
			{/* Quiz status and error messages */}
			{quizStatusMsg && (
				<div className="mb-2 text-blue-700 text-sm">{quizStatusMsg}</div>
			)}
			{showQuizError && quizError && (
				<div className="mb-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded flex items-center justify-between">
					<span>{quizError}</span>
					<button
						className="ml-4 text-red-700 font-bold px-2"
						onClick={() => setShowQuizError(false)}
						aria-label="Dismiss error"
					>
						×
					</button>
				</div>
			)}
			{/* Quiz control buttons */}
			<div className="mb-4 flex gap-2">
				{/* Start/End Quiz buttons removed; now handled by parent */}
			</div>
			{/* Students in Room */}
			<div className="font-semibold mb-2">Students in Room</div>
			{roomUsersError && (
				<div className="text-red-600 text-sm mb-2">{roomUsersError}</div>
			)}
			{/* Refresh button removed; updates are real-time via socket.io */}
			{students.length === 0 ? (
				<div className="text-gray-500 text-sm">
					No students in this room yet.
				</div>
			) : (
				<ul className="space-y-1">
					{students.map((s, i) => (
						<li key={i} className="text-sm">
							{s.userId}
						</li>
					))}
				</ul>
			)}
			{/* Live Progress Table */}
			<div className="mt-6">
				<div className="font-semibold mb-2">Live Progress</div>
				{students.length === 0 ? (
					<div className="text-gray-500 text-sm">No progress to show.</div>
				) : (
					<table className="w-full text-xs border">
						<thead>
							<tr>
								<th className="border px-2 py-1">Student</th>
								<th className="border px-2 py-1">Question</th>
								<th className="border px-2 py-1">Answer</th>
								<th className="border px-2 py-1">Time</th>
							</tr>
						</thead>
						<tbody>
							{students.map((s, idx) =>
								progress[s.userId] ? (
									Object.entries(progress[s.userId]).map(([qId, p]) => (
										<tr key={s.userId + qId}>
											<td className="border px-2 py-1">{s.userId}</td>
											<td className="border px-2 py-1">{qId}</td>
											<td className="border px-2 py-1">{p.answer}</td>
											<td className="border px-2 py-1">
												{p.timestamp
													? new Date(p.timestamp).toLocaleTimeString()
													: "-"}
											</td>
										</tr>
									))
								) : (
									<tr key={s.userId + "-none-" + idx}>
										<td className="border px-2 py-1">{s.userId}</td>
										<td className="border px-2 py-1" colSpan={3}>
											No answers yet
										</td>
									</tr>
								),
							)}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}

LiveQuizSection.propTypes = {
	quizId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
	mentorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
		.isRequired,
};

export default LiveQuizSection;
