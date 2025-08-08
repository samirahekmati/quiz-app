import { Route, Routes } from "react-router";

import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import "./App.css";
import About from "./pages/About.jsx";
import CreateQuiz from "./pages/CreateQuiz.jsx";
import Home from "./pages/Home.jsx";
import MentorLiveQuiz from "./pages/MentorLiveQuiz.jsx";
import MentorLogin from "./pages/MentorLogin.jsx";
import MentorSignup from "./pages/MentorSignup.jsx";
import QuizDashboard from "./pages/QuizDashboard.jsx";
import QuizDetail from "./pages/QuizDetail.jsx";
import QuizEdit from "./pages/QuizEdit.jsx";
import QuizReports from "./pages/QuizReports.jsx";
import StudentJoin from "./pages/StudentJoin.jsx";
import StudentQuiz from "./pages/StudentQuiz.jsx";
import StudentResult from "./pages/StudentResult.jsx";

function App() {
	return (
		<Routes>
			{/* Public pages (no sidebar) */}
			<Route path="/" element={<Home />} />
			<Route path="/nested/about/path" element={<About />} />
			<Route path="/mentor/signup" element={<MentorSignup />} />
			<Route path="/mentor/login" element={<MentorLogin />} />
			<Route path="/student/join" element={<StudentJoin />} />
			<Route path="/student/quiz/:quizId" element={<StudentQuiz />} />
			<Route path="/student/result/:quizId" element={<StudentResult />} />

			{/* Protected routes with sidebar layout */}
			<Route
				path="/mentor"
				element={
					<ProtectedRoute>
						<Layout />
					</ProtectedRoute>
				}
			>
				<Route path="dashboard" element={<QuizDashboard />} />
				<Route path="quiz/:id" element={<QuizDetail />} />
				<Route path="quiz/:quizId/edit" element={<QuizEdit />} />
				<Route path="live/:quizId" element={<MentorLiveQuiz />} />
				<Route path="create" element={<CreateQuiz />} />
				<Route path="reports" element={<QuizReports />} />
			</Route>
		</Routes>
	);
}

export default App;
