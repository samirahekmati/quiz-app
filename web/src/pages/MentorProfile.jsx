import { useState, useEffect } from "react";

import { fetchQuizzes } from "../services/quizService";

function MentorProfile() {
	const [mentorInfo, setMentorInfo] = useState({ email: "", username: "" });
	const [stats, setStats] = useState({
		completed: 0,
		incomplete: 0,
		total: 0,
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const token = localStorage.getItem("token");
		const email = localStorage.getItem("mentorEmail") || "";
		const username = localStorage.getItem("mentorUsername") || "Mentor";
		setMentorInfo({ email, username });

		fetchQuizzes(token, { includeReports: true })
			.then((quizzesData) => {
				const quizzes = quizzesData || [];
				const completedCount = quizzes.filter(
					(q) => q.quiz_status === "completed",
				).length;
				const incompleteCount = quizzes.length - completedCount;
				setStats({
					completed: completedCount,
					incomplete: incompleteCount,
					total: quizzes.length,
				});
			})
			.catch((err) => {
				setError(err.message || "Failed to load profile data.");
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	return (
		<div className="max-w-3xl mx-auto">
			<div className="bg-gray-50 p-8 rounded-xl shadow-md border border-gray-200">
				<h1 className="text-3xl font-bold text-gray-800 mb-4">
					Welcome, {mentorInfo.username}
				</h1>
				<p className="text-lg text-gray-600 mb-6">
					<span className="font-semibold">Email:</span> {mentorInfo.email}
				</p>

				<div className=" mt-6 pt-6 border-t border-gray-200">
					<h2 className="text-2xl font-bold text-gray-700 mb-4">Quiz Statistics</h2>
					{loading ? (
						<div className="flex justify-center items-center h-24">
							<span className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></span>
						</div>
					) : error ? (
						<div className="text-red-500">{error}</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
							<div className="p-4 bg-orange-100 rounded-lg">
								<p className="text-3xl font-bold text-orange-700">
									{stats.completed}
								</p>
								<p className="text-sm text-gray-600">Completed</p>
							</div>
							<div className="p-4 bg-green-100 rounded-lg">
								<p className="text-3xl font-bold text-green-700">
									{stats.incomplete}
								</p>
								<p className="text-sm text-gray-600">Incomplete</p>
							</div>
							<div className="p-4 bg-purple-100 rounded-lg">
								<p className="text-3xl font-bold text-purple-700">
									{stats.total}
								</p>
								<p className="text-sm text-gray-600">Total Quizzes</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default MentorProfile; 