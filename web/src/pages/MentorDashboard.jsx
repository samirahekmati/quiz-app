import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import getApiBaseUrl from "../services/apiBaseUrl";

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

	// TODO: Replace with GET /api/quizzes When API is available

	// const [quizzes, setQuizzes] = useState([]);
	// useEffect(() => {
	//   // fetch quizzes from API when endpoint is ready
	// }, []);

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
			{/* TODO: Quiz list will be rendered when API endpoint is available. */}
			{/* When the backend provides endpoint, fetch and display quizzes. */}
			{/* quiz list with Delete button (replace with real data/API): */}
			{/*
			<ul className="space-y-2 mt-6">
			  {quizzes.map((quiz) => (
			    <li key={quiz.id} className="flex justify-between items-center border p-2 rounded">
			      <span>{quiz.title} (ID: {quiz.id})</span>
			      <button
			        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
			        onClick={() => {
			          // TODO: Call API to delete quiz by quiz.id
			          // 
			          // fetch(`${getApiBaseUrl()}/quizzes/${quiz.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
			          //   .then(() => setQuizzes(quizzes.filter(q => q.id !== quiz.id)));
			        }}
			      >
			        Delete
			      </button>
			    </li>
			  ))}
			</ul>
			*/}
			<div className="border p-4 rounded bg-gray-50 text-gray-600 text-center">
				<p className="mb-2 font-semibold">Quiz list will appear here.</p>
				<p className="text-xs">
					All quiz operations in this project are based on{" "}
					<span className="font-mono bg-gray-200 px-1 rounded">quizId</span>.
					When the backend provides a list endpoint, this section will fetch and
					display quizzes by{" "}
					<span className="font-mono bg-gray-200 px-1 rounded">quizId</span>.
				</p>
			</div>
		</div>
	);
}

export default MentorDashboard;
