import getApiBaseUrl from "./apiBaseUrl";

// Fetch all quizzes created by the current mentor
// @param {string} token - The mentor's auth token
export async function fetchQuizzes(token) {
	const res = await fetch(`${getApiBaseUrl()}/quizzes/mine`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok)
		throw new Error((await res.json()).message || "Failed to load quizzes.");
	return res.json();
}

// Fetch details (including questions/options) for a specific quiz
// @param {string} token - The mentor's auth token
// @param {number|string} quizId - The quiz ID
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
// @param {string} token - The mentor's auth token
// @param {object} quiz - { title, description, duration } (duration in seconds)
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
// @param {string} token - The mentor's auth token
// @param {number|string} quizId - The quiz ID
export async function deleteQuiz(token, quizId) {
	const res = await fetch(`${getApiBaseUrl()}/quizzes/${quizId}`, {
		method: "DELETE",
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok) throw new Error("Failed to delete quiz.");
	return true;
}
