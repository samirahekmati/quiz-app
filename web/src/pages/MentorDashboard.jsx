// MentorDashboard page - shows mentor's quizzes and actions

// Mock data for quizzes (based on database structure)
const mockQuizzes = [
	{
		id: 1,
		user_id: 101,
		title: "JavaScript Basics",
		description: "A quiz about JS fundamentals.",
		duration: 900, // seconds (15 min)
	},
	{
		id: 2,
		user_id: 101,
		title: "React Intro",
		description: "Test your React knowledge!",
		duration: 600, // seconds (10 min)
	},
];

function MentorDashboard() {
	return (
		<div className="p-4 max-w-2xl mx-auto">
			<h1 className="text-2xl font-bold mb-4">Mentor Dashboard</h1>
			{/* Button to create a new quiz */}
			<button className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
				Create New Quiz
			</button>
			{/* List of quizzes */}
			<div>
				{mockQuizzes.length === 0 ? (
					<p>No quizzes yet.</p>
				) : (
					<ul className="space-y-4">
						{mockQuizzes.map((quiz) => (
							<li key={quiz.id} className="border p-4 rounded shadow-sm">
								<div className="font-semibold text-lg">{quiz.title}</div>
								<div className="text-gray-600 mb-2">{quiz.description}</div>
								<div className="text-sm text-gray-500 mb-2">
									Duration: {quiz.duration / 60} min
								</div>
								{/* Edit button (no action yet) */}
								<button className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">
									Edit
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

export default MentorDashboard;
