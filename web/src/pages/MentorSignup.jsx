import { useState } from "react";
import { useNavigate } from "react-router";

// Helper to load mentors from localStorage
const loadMentors = () => {
	const saved = localStorage.getItem("mentors");
	return saved ? JSON.parse(saved) : [];
};

function MentorSignup() {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [mentors, setMentors] = useState(loadMentors());
	const navigate = useNavigate();

	// Simple email format check
	const isValidEmail = (email) => /.+@.+\..+/.test(email);

	// Handle form submit
	const handleSubmit = (e) => {
		e.preventDefault();
		setError("");
		if (!username.trim() || !email.trim() || !password.trim()) {
			setError("All fields are required.");
			return;
		}
		if (!isValidEmail(email)) {
			setError("Invalid email format.");
			return;
		}
		if (
			mentors.some((m) => m.email.toLowerCase() === email.trim().toLowerCase())
		) {
			setError("Email already exists.");
			return;
		}
		const newId = mentors.length
			? Math.max(...mentors.map((m) => m.id)) + 1
			: 1;
		const newMentor = {
			id: newId,
			username: username.trim(),
			email: email.trim().toLowerCase(),
			password,
		};
		const updated = [...mentors, newMentor];
		setMentors(updated);
		localStorage.setItem("mentors", JSON.stringify(updated));
		localStorage.setItem("currentMentorId", newMentor.id);
		navigate("/mentor/dashboard");
	};

	return (
		<div className="p-4 max-w-md mx-auto">
			<h1 className="text-2xl font-bold mb-4">Mentor Signup</h1>
			<form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded">
				<div>
					<label htmlFor="username" className="block font-medium mb-1">
						Username
					</label>
					<input
						id="username"
						className="border rounded px-2 py-1 w-full"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
					/>
				</div>
				<div>
					<label htmlFor="email" className="block font-medium mb-1">
						Email
					</label>
					<input
						id="email"
						className="border rounded px-2 py-1 w-full"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
				</div>
				<div>
					<label htmlFor="password" className="block font-medium mb-1">
						Password
					</label>
					<input
						id="password"
						className="border rounded px-2 py-1 w-full"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</div>
				{error && <div className="text-red-600 text-sm">{error}</div>}
				<button
					type="submit"
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
				>
					Sign Up
				</button>
			</form>
		</div>
	);
}

export default MentorSignup;
