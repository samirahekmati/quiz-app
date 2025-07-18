import { Link } from "react-router-dom";

// Landing page for the quiz app (MVP ONLY)
// In production, you can improve the design and add branding/logo
function Home() {
	return (
		<main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
			<div className="max-w-md w-full p-8 bg-white rounded shadow text-center">
				<h1 className="text-3xl font-bold mb-6">Welcome to Quiz App</h1>
				<p className="mb-8 text-gray-600">
					Please select your role to continue:
				</p>
				<div className="flex flex-col gap-4">
					<Link
						to="/mentor/signup"
						className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-lg font-semibold"
					>
						Sign Up as a Mentor
					</Link>
					<br />
					<Link
						to="/mentor/login"
						className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-lg font-semibold"
					>
						Log in as a Mentor
					</Link>
					<br />
					<Link
						to="/student/join"
						className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition text-lg font-semibold"
					>
						I am a Student
					</Link>
				</div>
			</div>
		</main>
	);
}

export default Home;
