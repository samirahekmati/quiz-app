// Helper to get API base URL from env or default
const getApiBaseUrl = () => {
	return import.meta.env.VITE_API_URL || "/api";
};

export default getApiBaseUrl;
