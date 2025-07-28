import getApiBaseUrl from "./apiBaseUrl";

// Fetch all quizzes created by the current mentor
export async function fetchQuizzes(token) {
	const res = await fetch(`${getApiBaseUrl()}/quizzes/mine`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok)
		throw new Error((await res.json()).message || "Failed to load quizzes.");
	return res.json();
}

// Fetch details (including questions/options) for a specific quiz
export async function fetchQuizDetail(token, quizId) {
	const res = await fetch(`${getApiBaseUrl()}/quizzes/${quizId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok)
		throw new Error(
			(await res.json()).message || "Failed to load quiz detail.",
		);
	return res.json();
}

// Create a new quiz
export async function createQuiz(token, { title, description, duration }) {
	const res = await fetch(`${getApiBaseUrl()}/quizzes`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ title, description, duration }),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to create quiz.");
	return data;
}

// Delete a quiz by ID
export async function deleteQuiz(token, quizId) {
	const res = await fetch(`${getApiBaseUrl()}/quizzes/${quizId}`, {
		method: "DELETE",
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok) throw new Error("Failed to delete quiz.");
	return true;
}

// Update a quiz by ID
export async function updateQuiz(token, quizId, updates) {
	const res = await fetch(`${getApiBaseUrl()}/quizzes/${quizId}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(updates),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to update quiz.");
	return data;
}
