import mentoroLogo from "../assets/mentoro-white-logo.png";
import quizIllustration from "../assets/quiz-illustration.png";

export default function Home() {
	return (
		<div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gradient-to-b from-purple-600 to-purple-900">
			{/* Left section: logo/branding/illustration */}
			<div className="flex-1 flex flex-col items-center justify-center p-8">
				<img src={mentoroLogo} alt="Mentoro Logo" className="w-96 mb-8" />
				<p className="text-white text-lg mb-8 text-center max-w-xs">
					We believe learning is best with guidance. Join as a mentor or
					student, take quizzes, and grow together in a supportive environment.
				</p>
				<img src={quizIllustration} alt="Quiz Illustration" className="w-96" />
			</div>
			{/* Right section: card will go here */}
			<div className="flex-1 flex items-center justify-center p-8">
				{/* TODO: Add card here */}
			</div>
		</div>
	);
}
