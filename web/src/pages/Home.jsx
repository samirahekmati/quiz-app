import { Link } from "react-router-dom";

// Landing page for the quiz app (MVP ONLY)
// In production, you can improve the design and add branding/logo
function Home() {
	return (
		<main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
			<div className="max-w-md w-full p-8 bg-white rounded shadow text-center">
				<h1 className="text-3xl font-bold mb-6">Welcome to Mentoro</h1>
				<p className="mb-8 text-gray-600">
					Please select your role to continue:
				</p>
				<div className="flex flex-col gap-4">
					<Link
						to="/mentor/signup"
						className="btn-primary text-lg font-semibold"
					>
						Sign Up as a Mentor
					</Link>
					<br />
					<Link
						to="/mentor/login"
						className="btn-primary text-lg font-semibold"
					>
						Log in as a Mentor
					</Link>
					<br />
					<Link
						to="/student/join"
						className="btn-student text-lg font-semibold"
					>
						I am a Student
					</Link>
				</div>
			</div>
		</main>
	);
}

export default Home;
