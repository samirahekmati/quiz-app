// import { useEffect, useState } from "react"; TODO:Uncomment when API is ready
import { useNavigate } from "react-router";

function StudentResult() {
	// const { quizId } = useParams(); TODO:Uncomment when API is ready
	// const navigate = useNavigate(); TODO:Uncomment when API is ready
	// const [result, setResult] = useState(null); TODO:Uncomment when API is ready

	// TODO: GET /api/quizzes/:quizId/result?studentId=... to fetch result from backend when endpoint is available
	//
	// useEffect(() => {
	//   const studentId = localStorage.getItem("studentId");
	//   fetch(`${getApiBaseUrl()}/quizzes/${quizId}/result?studentId=${studentId}`)
	//     .then(res => res.json())
	//     .then(data => setResult(data));
	// }, [quizId]);

	const navigate = useNavigate();

	return (
		<div className="p-4 max-w-md mx-auto text-center">
			<h1 className="text-2xl font-bold mb-4">Quiz Result</h1>
			{/* TODO: Render result from API here */}
			<div className="border p-4 rounded bg-gray-50 text-gray-600 text-center">
				<p className="mb-2 font-semibold">
					Quiz result will appear here (API integration coming soon).
				</p>
			</div>
			<button
				className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
				onClick={() => navigate("/student/join")}
			>
				Back to Join
			</button>
		</div>
	);
}

export default StudentResult;
