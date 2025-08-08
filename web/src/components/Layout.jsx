import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import mentoroLogo from "../assets/mentoro-white-logo.png";
import getApiBaseUrl from "../services/apiBaseUrl";

export default function Layout() {
	const [mentor, setMentor] = useState(null);

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) {
			console.log("No token found");
			return;
		}

		console.log("Making API call to fetch mentor details...");
		fetch(`${getApiBaseUrl()}/auth/mentor`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then((res) => {
				console.log("API response status:", res.status);
				if (!res.ok) throw new Error("Failed to fetch mentor details");
				return res.json();
			})
			.then((data) => {
				setMentor(data);
				console.log("Mentor API response:", data);
				console.log("Mentor object keys:", Object.keys(data));
			})
			.catch((err) => {
				console.error("API call failed:", err);
			});
	}, []);
	const navigate = useNavigate();
	// "Quizzes" is the default active section when the page loads
	const [activeSection, setActiveSection] = useState("quizzes");
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	// Sidebar links
	const navLinks = [
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

			{/* Main Content Area */}
			<div className="flex-1">
				{/* Header section with hello message and logout - only spans main content */}
				<header
					className="fixed top-0 right-0 lg:left-64 z-50 bg-white shadow-md px-4 py-4 flex justify-between items-center"
					style={{ height: "80px" }}
				>
					<div className="flex items-center space-x-3">
						{/* Mobile hamburger menu button */}
						<button
							onClick={() => setIsSidebarOpen(!isSidebarOpen)}
							className="lg:hidden p-2 bg-purple-600 text-white rounded-md shadow-lg hover:bg-purple-700 transition-colors"
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

						{/* Hello message */}
						<div className="text-purple-800 text-2xl ms-8 font-semibold">
							Hello,{" "}
							{mentor && mentor.length > 0 ? mentor[0].username : "Mentor"}!
						</div>
					</div>

					{/* Logout button */}
					<button
						onClick={handleLogout}
						className="px-4 py-2 bg-purple-600 text-white rounded shadow hover:bg-purple-700 transition"
					>
						Logout
					</button>
				</header>

				{/* Overlay for mobile */}
				{isSidebarOpen && (
					<button
						className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
						onClick={() => setIsSidebarOpen(false)}
						aria-label="Close sidebar"
					/>
				)}

				{/* Main Content */}
				<main className="p-8 pt-28">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
