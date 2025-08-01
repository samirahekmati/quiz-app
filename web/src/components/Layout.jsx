import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import mentoroLogo from "../assets/mentoro-white-logo.png";

export default function Layout() {
	const navigate = useNavigate();
	// "Quizzes" is the default active section when the page loads
	const [activeSection, setActiveSection] = useState("quizzes");
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	// Sidebar links
	const navLinks = [
		{ label: "Profile", section: "profile", path: "/mentor/profile" },
		{ label: "Quizzes", section: "quizzes", path: "/mentor/dashboard" },
		{ label: "Create New Quiz", section: "create", path: "/mentor/create" },
		{ label: "Quiz reports", section: "reports", path: "/mentor/reports" },
	];

	// Handle logout
	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("currentMentorId");
		localStorage.removeItem("mentorEmail");
		localStorage.removeItem("mentorUsername");
		navigate("/mentor/login");
	};

	// Handle navigation
	const handleNavigation = (link) => {
		setActiveSection(link.section);
		navigate(link.path);
		setIsSidebarOpen(false); // Close sidebar on mobile after navigation
	};

	return (
		<div className="flex min-h-screen bg-purple-50 relative">
			{/* Mobile hamburger menu button */}
			<button
				onClick={() => setIsSidebarOpen(!isSidebarOpen)}
				className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-purple-600 text-white rounded-md shadow-lg hover:bg-purple-700 transition-colors"
			>
				<svg
					className="w-6 h-6"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</button>

			{/* Logout button top right */}
			<button
				onClick={handleLogout}
				className="fixed top-4 right-4 px-4 py-2 bg-gray-400 text-white rounded shadow hover:bg-gray-600 transition z-40"
			>
				Logout
			</button>

			{/* Overlay for mobile */}
			{isSidebarOpen && (
				<button
					className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
					onClick={() => setIsSidebarOpen(false)}
					aria-label="Close sidebar"
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-purple-600 to-purple-400 text-white shadow-lg flex flex-col transform transition-transform duration-300 ease-in-out ${
					isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
				}`}
			>
				{/* Sidebar header */}
				<div className="p-6 text-2xl font-bold border-b border-purple-300">
					<img
						src={mentoroLogo}
						alt="Mentoro Logo"
						className="w-48 mb-8 mt-8"
					/>
				</div>

				{/* Navigation items */}
				<ul className="flex-1 p-4 space-y-2">
					{navLinks.map((link) => (
						<li key={link.section}>
							<button
								className={`w-full text-left px-4 py-2 rounded transition font-semibold ${
									activeSection === link.section
										? "bg-white text-purple-700"
										: "hover:bg-purple-700 hover:text-white"
								}`}
								onClick={() => handleNavigation(link)}
							>
								{link.label}
							</button>
						</li>
					))}
				</ul>

				{/* Close button for mobile */}
				<button
					onClick={() => setIsSidebarOpen(false)}
					className="lg:hidden p-4 text-white hover:bg-purple-700 transition-colors"
				>
					<svg
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</aside>

			{/* Main Content */}
			<main className="flex-1 p-8 pt-24 lg:ml-0">
				<Outlet />
			</main>
		</div>
	);
}
