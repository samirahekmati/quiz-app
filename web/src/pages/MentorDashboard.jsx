import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import {
	fetchQuizzes,
	fetchQuizDetail,
	createQuiz,
	deleteQuiz,
} from "../services/quizService";
// import { emitEvent } from "../services/socket";

// import LiveQuizSection from "./LiveQuizSection";

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

	// State for sidebar navigation
	const [activeSection, setActiveSection] = useState("dashboard");
	// Quiz creation state
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [duration, setDuration] = useState(""); // in minutes
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	// Quizzes state
	const [quizzes, setQuizzes] = useState([]);
	const [loadingQuizzes, setLoadingQuizzes] = useState(false);
	const [quizzesError, setQuizzesError] = useState("");

	// Quiz detail state
	const [selectedQuiz, setSelectedQuiz] = useState(null); // quiz object
	const [quizDetail, setQuizDetail] = useState(null); // fetched quiz detail (questions/answers)
	const [loadingQuizDetail, setLoadingQuizDetail] = useState(false);
	const [quizDetailError, setQuizDetailError] = useState("");

	// Add delete handler
	const [deletingQuizId, setDeletingQuizId] = useState(null);

	// Fetch quizzes when in dashboard
	useEffect(() => {
		if (activeSection !== "dashboard") return;
		const token = localStorage.getItem("token");
		setLoadingQuizzes(true);
		setQuizzesError("");
		fetchQuizzes(token)
			.then((data) => setQuizzes(data || []))
			.catch((err) => setQuizzesError(err.message || "Failed to load quizzes."))
			.finally(() => setLoadingQuizzes(false));
	}, [activeSection]);

	// Fetch quiz detail when selectedQuiz changes
	useEffect(() => {
		if (!selectedQuiz) return;
		const token = localStorage.getItem("token");
		setLoadingQuizDetail(true);
		setQuizDetailError("");
		fetchQuizDetail(token, selectedQuiz.id)
			.then((data) => setQuizDetail(data))
			.catch((err) =>
				setQuizDetailError(err.message || "Failed to load quiz detail."),
			)
			.finally(() => setLoadingQuizDetail(false));
	}, [selectedQuiz]);

	// Handle quiz creation
	const handleCreateQuiz = async (e) => {
		e.preventDefault();
		setError("");
		if (!title.trim() || !duration) {
			setError("Title and duration are required.");
			return;
		}
		setLoading(true);
		const token = localStorage.getItem("token");
		try {
			const data = await createQuiz(token, {
				title: title.trim(),
				description: description.trim(),
				duration: Number(duration) * 60,
			});
			setTitle("");
			setDescription("");
			setDuration("");
			navigate(`/mentor/quiz/${data.quiz.id}/edit`);
		} catch (err) {
			setError(err.message || "Failed to create quiz.");
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteQuiz = async (quizId) => {
		if (!window.confirm("Are you sure you want to delete this quiz?")) return;
		setDeletingQuizId(quizId);
		const token = localStorage.getItem("token");
		try {
			await deleteQuiz(token, quizId);
			setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
		} catch (err) {
			alert(err.message || "Failed to delete quiz.");
		} finally {
			setDeletingQuizId(null);
		}
	};

	// Add logout handler
	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("currentMentorId");
		localStorage.removeItem("mentorEmail");
		localStorage.removeItem("mentorUsername");
		navigate("/mentor/login");
	};

	// Sidebar links
	const navLinks = [
		{ label: "Profile", section: "profile" },
		{ label: "Create New Quiz", section: "create" },
		{ label: "See Quiz Results", section: "results" },
	];

	// Main content for each section
	let mainContent = null;
	if (selectedQuiz) {
		// Quiz detail view (no sidebar)
		mainContent = (
			<div className="max-w-2xl mx-auto">
				<button
					className="mb-6 px-4 py-2 rounded bg-purple-500 text-white hover:bg-purple-700 transition font-semibold shadow"
					onClick={() => {
						setSelectedQuiz(null);
						setQuizDetail(null);
					}}
				>
					← Return to Dashboard
				</button>
				{loadingQuizDetail ? (
					<div className="flex justify-center items-center h-32">
						<span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></span>
					</div>
				) : quizDetailError ? (
					<div className="text-red-500">{quizDetailError}</div>
				) : quizDetail ? (
					<div className="bg-purple-100 p-8 rounded-2xl shadow-lg border-t-4 border-purple-500 relative">
						{/* Start this quiz button */}
						<button
							className="absolute left-8 top-8 px-4 py-2 bg-purple-500 text-white rounded shadow hover:bg-purple-700 transition font-semibold"
							onClick={() => navigate(`/mentor/live/${selectedQuiz.id}`)}
						>
							Run this Quiz
						</button>
						{/* Edit this quiz button */}
						<button
							className="absolute right-8 top-8 px-4 py-2 bg-purple-500 text-white rounded shadow hover:bg-purple-700 transition font-semibold"
							onClick={() => navigate(`/mentor/quiz/${quizDetail.id}/edit`)}
						>
							Edit this quiz
						</button>
						<h2 className="text-2xl font-bold mb-2 text-purple-800 mt-16">
							{quizDetail.title}
						</h2>
						<div className="mb-2 text-purple-700">{quizDetail.description}</div>
						<div className="mb-4 text-sm text-purple-400">
							Duration: {Math.round(quizDetail.duration / 60)} min
						</div>
						<h3 className="text-lg font-semibold mb-4 text-purple-700">
							Questions & Answers
						</h3>
						{quizDetail.questions && quizDetail.questions.length > 0 ? (
							<ul className="space-y-6">
								{quizDetail.questions.map((q, idx) => (
									<li
										key={q.id}
										className="border rounded-lg p-4 bg-white mb-2"
									>
										<div className="font-semibold mb-2 text-purple-800">
											Q{idx + 1}: {q.text}
										</div>
										<ul className="list-disc pl-6 space-y-1 text-left">
											{q.options.map((opt) => (
												<li
													key={opt.id}
													className={
														opt.is_correct
															? "text-green-600 font-semibold"
															: "text-purple-700"
													}
												>
													{opt.text}{" "}
													{opt.is_correct && (
														<span className="ml-2 px-2 py-0.5 rounded bg-green-200 text-green-800 text-xs">
															Correct
														</span>
													)}
												</li>
											))}
										</ul>
									</li>
								))}
							</ul>
						) : (
							<div>No questions found for this quiz.</div>
						)}
						{/* Live quiz section for real-time management */}
					</div>
				) : null}
			</div>
		);
	} else if (activeSection === "profile") {
		mainContent = (
			<div className="max-w-xl mx-auto">
				<h2 className="text-2xl font-bold mb-4 text-purple-800">Profile</h2>
				<div className="p-6 bg-purple-100 rounded-2xl shadow-lg text-purple-700 border-t-4 border-purple-500">
					Profile section coming soon...
				</div>
			</div>
		);
	} else if (activeSection === "results") {
		mainContent = (
			<div className="max-w-xl mx-auto">
				<h2 className="text-2xl font-bold mb-4 text-purple-800">
					Quiz Results
				</h2>
				<div className="p-6 bg-purple-100 rounded-2xl shadow-lg text-purple-700 border-t-4 border-purple-500">
					Quiz results section coming soon...
				</div>
			</div>
		);
	} else if (activeSection === "create") {
		mainContent = (
			<div className="max-w-xl mx-auto">
				<button
					className="mb-6 px-4 py-2 rounded bg-purple-500 text-white hover:bg-purple-600 transition"
					onClick={() => setActiveSection("dashboard")}
				>
					← Return to Dashboard
				</button>
				<h2 className="text-2xl font-bold mb-4 text-purple-800">
					Create New Quiz
				</h2>
				<form
					onSubmit={handleCreateQuiz}
					className="space-y-4 bg-purple-100 p-8 rounded-2xl shadow-lg border-t-4 border-purple-500"
				>
					<div>
						<label
							htmlFor="quiz-title"
							className="block font-medium mb-1 text-purple-700"
						>
							Title
						</label>
						<input
							id="quiz-title"
							className="border rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
						/>
					</div>
					<div>
						<label
							htmlFor="quiz-description"
							className="block font-medium mb-1 text-purple-700"
						>
							Description
						</label>
						<textarea
							id="quiz-description"
							className="border rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>
					<div>
						<label
							htmlFor="quiz-duration"
							className="block font-medium mb-1 text-purple-700"
						>
							Duration (minutes)
						</label>
						<input
							id="quiz-duration"
							className="border rounded px-2 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-purple-400"
							type="number"
							min="1"
							value={duration}
							onChange={(e) => setDuration(e.target.value)}
							required
						/>
					</div>
					{error && <div className="text-red-500 text-sm">{error}</div>}
					<button
						type="submit"
						className="w-full px-4 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
						disabled={loading}
					>
						{loading ? "Creating..." : "Create Quiz"}
					</button>
				</form>
			</div>
		);
	} else {
		// Dashboard: show quizzes
		mainContent = (
			<div className="max-w-5xl mx-auto">
				<h2 className="text-2xl font-bold mb-6 text-purple-800">
					Your Quizzes
				</h2>
				{loadingQuizzes ? (
					<div className="flex justify-center items-center h-32">
						<span className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></span>
					</div>
				) : quizzesError ? (
					<div className="text-red-500">{quizzesError}</div>
				) : quizzes.length === 0 ? (
					<div>No quizzes found.</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
						{quizzes.map((quiz) => (
							<button
								key={quiz.id}
								type="button"
								onClick={() => setSelectedQuiz(quiz)}
								className="bg-purple-100 rounded-lg shadow p-6 border border-purple-200 relative w-full text-left hover:scale-105 transition-transform focus:outline-none"
								aria-label={`View quiz ${quiz.title}`}
							>
								<h2 className="text-lg font-bold text-purple-900 mb-2">
									{quiz.title}
								</h2>
								<p className="text-purple-700 mb-2">{quiz.description}</p>
								<div className="flex justify-between items-center mt-4">
									<span className="bg-purple-500 text-white px-2 py-1 rounded text-xs">
										ID: {quiz.id}
									</span>
									<span className="bg-purple-300 text-purple-900 px-2 py-1 rounded text-xs">
										{Math.round(quiz.duration / 60)} min
									</span>
								</div>
								<span
									role="button"
									tabIndex={0}
									className="absolute top-2 right-2 px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-600 transition z-20 cursor-pointer select-none"
									onClick={(e) => {
										e.stopPropagation();
										handleDeleteQuiz(quiz.id);
									}}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.stopPropagation();
											handleDeleteQuiz(quiz.id);
										}
									}}
									aria-disabled={deletingQuizId === quiz.id}
									style={{
										opacity: deletingQuizId === quiz.id ? 0.6 : 1,
										pointerEvents: deletingQuizId === quiz.id ? "none" : "auto",
									}}
								>
									{deletingQuizId === quiz.id ? "Deleting..." : "Delete"}
								</span>
							</button>
						))}
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="flex min-h-screen bg-purple-50 relative">
			{/* Logout button top right */}
			{activeSection !== "create" && !selectedQuiz && (
				<button
					onClick={handleLogout}
					className="absolute top-6 right-8 px-4 py-2 bg-gray-400 text-white rounded shadow hover:bg-gray-600 transition z-20"
				>
					Logout
				</button>
			)}
			{/* Sidebar: hidden when creating quiz or viewing quiz detail */}
			{activeSection !== "create" && !selectedQuiz && (
				<aside className="w-64 bg-gradient-to-b from-purple-600 to-purple-400 text-white shadow-lg flex flex-col">
					<div className="p-6 text-2xl font-bold border-b border-purple-300">
						Welcome,
					</div>
					<ul className="flex-1 p-4 space-y-2">
						{navLinks.map((link) => (
							<li key={link.section}>
								<button
									className={`w-full text-left px-4 py-2 rounded transition font-semibold ${activeSection === link.section ? "bg-white text-purple-700" : "hover:bg-purple-700 hover:text-white"}`}
									onClick={() => setActiveSection(link.section)}
								>
									{link.label}
								</button>
							</li>
						))}
					</ul>
				</aside>
			)}
			{/* Main Content */}
			<main className="flex-1 p-8">{mainContent}</main>
		</div>
	);
}

export default MentorDashboard;
