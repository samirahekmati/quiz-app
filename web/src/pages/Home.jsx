import { Link } from "react-router-dom";

import mentoroLogo from "../assets/mentoro-white-logo.png";
import quizIllustration from "../assets/quiz-illustration.png";

export default function Home() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-600 to-purple-900">
			<div className="flex flex-col md:flex-row items-center justify-center gap-x-32 max-w-5xl w-full mx-auto">
				{/* Left section: logo/branding/illustration */}
				<div className="flex flex-col items-center justify-center p-8 w-96">
					<img src={mentoroLogo} alt="Mentoro Logo" className="w-96 mb-8" />
					<p className="text-white text-lg mb-8 text-center max-w-xs">
						Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam
						nonummy nibh euismod tincidunt ut laoreet dolore
					</p>
					<img
						src={quizIllustration}
						alt="Quiz Illustration"
						className="w-96"
					/>
				</div>
				{/* Right section: authentication card */}
				<div className="flex items-center justify-center p-8 w-96">
					<div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center w-full">
						<p className="mb-6 text-gray-700 text-center">
							Please select your role to continue:
						</p>
						<Link
							to="/mentor/signup"
							className="btn-primary mb-6 text-lg font-semibold text-center"
						>
							Sign up as a Mentor
						</Link>
						<Link
							to="/mentor/login"
							className="btn-primary mb-6 text-lg font-semibold text-center"
						>
							Log in as a Mentor
						</Link>
						<Link
							to="/student/join"
							className="btn-student text-lg font-semibold text-center"
						>
							I am a Student
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
