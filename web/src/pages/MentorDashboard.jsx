import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import getApiBaseUrl from "../services/apiBaseUrl";
import {
	connectSocket,
	emitEvent,
	registerReconnectHandler,
} from "../services/socket";

function MentorDashboard() {
	const navigate = useNavigate();

	// Session check: if not logged in, redirect to login
	useEffect(() => {
		const token = localStorage.getItem("token");
		const mentorId = localStorage.getItem("currentMentorId");
		if (!token || !mentorId) {
			navigate("/mentor/login");
		}
	}, [navigate]);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [duration, setDuration] = useState(""); // in minutes
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	// New state to hold quizzes list
	const [quizzes, setQuizzes] = useState([]);
	const [loadingQuizzes, setLoadingQuizzes] = useState(false);
	const [quizzesError, setQuizzesError] = useState("");

	// Real-time: quizId state for joining room
	const [activeQuizId, setActiveQuizId] = useState("");
	// Real-time: state for students in the room
	const [students, setStudents] = useState([]);
	const [roomUsersError, setRoomUsersError] = useState("");
	// Real-time: state for live student progress (userId -> { questionId: { answer, timestamp } })
	const [progress, setProgress] = useState({});
	// Real-time: state for quiz status and error
	const [quizStarted, setQuizStarted] = useState(false);
	const [quizEnded, setQuizEnded] = useState(false);
	const [quizStatusMsg, setQuizStatusMsg] = useState("");
	const [quizError, setQuizError] = useState("");

	// Fetch quizzes created by mentor on mount
	useEffect(() => {
		const fetchQuizzes = async () => {
			setLoadingQuizzes(true);
			setQuizzesError("");
			const token = localStorage.getItem("token");

			if (!token) {
				setQuizzesError("You must be logged in.");
				setLoadingQuizzes(false);
				return;
			}

			try {
				const res = await fetch(`${getApiBaseUrl()}/quizzes/mine`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!res.ok) {
					const errorData = await res.json();
					setQuizzesError(errorData.message || "Failed to load quizzes.");
					setLoadingQuizzes(false);
					return;
				}

				const data = await res.json();
				setQuizzes(data || []); // The endpoint returns an array directly
			} catch {
				setQuizzesError("Network error. Please try again.");
			} finally {
				setLoadingQuizzes(false);
			}
		};

		fetchQuizzes();
	}, []);

	// Connect mentor socket and join quiz room when activeQuizId changes
	useEffect(() => {
		// Only connect if mentor is logged in and quizId is selected
		const token = localStorage.getItem("token");
		const mentorId = localStorage.getItem("currentMentorId");
		if (!token || !mentorId || !activeQuizId) return;
		// Connect socket (mentor)
		connectSocket({ token, userId: mentorId, role: "mentor" });
		// Join quiz room as mentor
		emitEvent("join-room", {
			quizId: activeQuizId,
			userId: mentorId,
			role: "mentor",
		});
		// Emit get-room-users to fetch current students
		emitEvent("get-room-users", { quizId: activeQuizId });
		// Listen for room-users event
		const handleRoomUsers = (data) => {
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
		window.addEventListener("room-users", handleRoomUsers);
		window.addEventListener("error", handleRoomUsersError);
		// Listen for progress-update event (live student answers)
		const handleProgressUpdate = (data) => {
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
		window.addEventListener("progress-update", handleProgressUpdate);
		// Listen for quiz-started event
		const handleQuizStarted = (data) => {
			setQuizStarted(true);
			setQuizEnded(false);
			setQuizStatusMsg(
				"Quiz started at " +
					(data?.startedAt
						? new Date(data.startedAt).toLocaleTimeString()
						: "now"),
			);
		};
		// Listen for quiz-ended event
		const handleQuizEnded = (data) => {
			setQuizStarted(false);
			setQuizEnded(true);
			setQuizStatusMsg(
				"Quiz ended at " +
					(data?.endedAt ? new Date(data.endedAt).toLocaleTimeString() : "now"),
			);
		};
		// Listen for error event
		const handleQuizError = (err) => {
			setQuizError(err.message || "An error occurred.");
			setTimeout(() => setQuizError(""), 4000);
		};
		window.addEventListener("quiz-started", handleQuizStarted);
		window.addEventListener("quiz-ended", handleQuizEnded);
		window.addEventListener("error", handleQuizError);
		// Reconnect handling: on connect/reconnect, re-emit join-room and get-room-users
		registerReconnectHandler(() => {
			const token = localStorage.getItem("token");
			const mentorId = localStorage.getItem("currentMentorId");
			if (!token || !mentorId || !activeQuizId) return;
			emitEvent("join-room", {
				quizId: activeQuizId,
				userId: mentorId,
				role: "mentor",
			});
			emitEvent("get-room-users", { quizId: activeQuizId });
		});
		// Cleanup listeners on unmount or quiz change
		return () => {
			window.removeEventListener("room-users", handleRoomUsers);
			window.removeEventListener("error", handleRoomUsersError);
			window.removeEventListener("progress-update", handleProgressUpdate);
			window.removeEventListener("quiz-started", handleQuizStarted);
			window.removeEventListener("quiz-ended", handleQuizEnded);
			window.removeEventListener("error", handleQuizError);
		};
	}, [activeQuizId]);

	const handleCreateQuiz = async (e) => {
		e.preventDefault();
		setError("");
		if (!title.trim() || !duration) {
			setError("Title and duration are required.");
			return;
		}
		setLoading(true);
		const token = localStorage.getItem("token");
		if (!token) {
			setError("You must be logged in.");
			setLoading(false);
			return;
		}
		console.log("Using token:", token);
		try {
			const res = await fetch(`${getApiBaseUrl()}/quizzes`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim(),
					duration: Number(duration) * 60,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.message || "Failed to create quiz.");
				setLoading(false);
				return;
			}
			// Success: redirect to edit page for new quiz
			navigate(`/mentor/quiz/${data.quiz.id}/edit`);
		} catch {
			setError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("currentMentorId");
		localStorage.removeItem("mentorEmail");
		localStorage.removeItem("mentorUsername");
		navigate("/mentor/login");
	};

	return (
		<div className="p-4 max-w-2xl mx-auto">
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-bold">Mentor Dashboard</h1>
				<button
					className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
					onClick={handleLogout}
				>
					Logout
				</button>
			</div>
			{/* Create New Quiz Form */}
			<form
				onSubmit={handleCreateQuiz}
				className="mb-8 space-y-4 border p-4 rounded"
			>
				<div>
					<label htmlFor="quiz-title" className="block font-medium mb-1">
						Title
					</label>
					<input
						id="quiz-title"
						className="border rounded px-2 py-1 w-full"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						required
					/>
				</div>
				<div>
					<label htmlFor="quiz-description" className="block font-medium mb-1">
						Description
					</label>
					<textarea
						id="quiz-description"
						className="border rounded px-2 py-1 w-full"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
				</div>
				<div>
					<label htmlFor="quiz-duration" className="block font-medium mb-1">
						Duration (minutes)
					</label>
					<input
						id="quiz-duration"
						className="border rounded px-2 py-1 w-32"
						type="number"
						min="1"
						value={duration}
						onChange={(e) => setDuration(e.target.value)}
						required
					/>
				</div>
				{error && <div className="text-red-600 text-sm">{error}</div>}
				<button
					type="submit"
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
					disabled={loading}
				>
					{loading ? "Creating..." : "Create New Quiz"}
				</button>
			</form>
			{/* Quiz list section */}
			<div className="border p-4 rounded bg-gray-50 text-gray-600">
				<p className="mb-2 font-semibold">Your Quizzes</p>
				{loadingQuizzes ? (
					<div>Loading quizzes...</div>
				) : quizzesError ? (
					<div className="text-red-600">{quizzesError}</div>
				) : quizzes.length === 0 ? (
					<div>No quizzes found.</div>
				) : (
					<ul className="space-y-2">
						{quizzes.map((quiz) => (
							<li
								key={quiz.id}
								className="flex justify-between items-center border p-2 rounded bg-white"
							>
								<div>
									<span className="font-bold">{quiz.title}</span>
									<span className="ml-2 text-xs text-gray-500">
										(ID: {quiz.id})
									</span>
									<div className="text-sm text-gray-500">
										{quiz.description}
									</div>
									<div className="text-xs text-gray-400">
										Duration: {quiz.duration} seconds
									</div>
								</div>
								<button onClick={() => setActiveQuizId(quiz.id)}>Manage</button>
							</li>
						))}
					</ul>
				)}
			</div>
			{activeQuizId && (
				<div className="mt-4 border p-4 rounded bg-gray-50">
					{/* Quiz status and error messages */}
					{quizStatusMsg && (
						<div className="mb-2 text-blue-700 text-sm">{quizStatusMsg}</div>
					)}
					{quizError && (
						<div className="mb-2 text-red-600 text-sm">{quizError}</div>
					)}
					{/* Quiz control buttons */}
					<div className="mb-4 flex gap-2">
						{!quizStarted && !quizEnded && (
							<button
								className="px-3 py-1 bg-green-600 text-white rounded text-sm"
								onClick={() => {
									// Emit quiz-started event
									emitEvent("quiz-started", {
										quizId: activeQuizId,
										startedAt: new Date().toISOString(),
										duration: 60 * 5, // 5 minutes default, can be improved
									});
								}}
							>
								Start Quiz
							</button>
						)}
						{quizStarted && !quizEnded && (
							<button
								className="px-3 py-1 bg-red-600 text-white rounded text-sm"
								onClick={() => {
									// Emit quiz-ended event (force end)
									emitEvent("quiz-ended", {
										quizId: activeQuizId,
										endedAt: new Date().toISOString(),
									});
								}}
							>
								End Quiz
							</button>
						)}
					</div>
					{/* Students in Room */}
					<div className="font-semibold mb-2">Students in Room</div>
					{roomUsersError && (
						<div className="text-red-600 text-sm mb-2">{roomUsersError}</div>
					)}
					<button
						className="mb-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
						onClick={() =>
							emitEvent("get-room-users", { quizId: activeQuizId })
						}
					>
						Refresh
					</button>
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
									{students.map((s) =>
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
											<tr key={s.userId + "-none"}>
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
			)}
		</div>
	);
}

export default MentorDashboard;
