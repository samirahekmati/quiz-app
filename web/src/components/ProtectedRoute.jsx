import { useEffect } from "react";
import { useNavigate } from "react-router";

function ProtectedRoute({ children }) {
	const navigate = useNavigate();
	useEffect(() => {
		const token = localStorage.getItem("token");
		const mentorId = localStorage.getItem("currentMentorId");
		if (!token || !mentorId) {
			navigate("/mentor/login");
		}
	}, [navigate]);
	return children;
}

export default ProtectedRoute;
