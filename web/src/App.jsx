import { Route, Routes } from "react-router";

import "./App.css";
import About from "./pages/About.jsx";
import Home from "./pages/Home.jsx";
import MentorDashboard from "./pages/MentorDashboard.jsx";
import MentorLogin from "./pages/MentorLogin.jsx";
import MentorSignup from "./pages/MentorSignup.jsx";
import QuizEdit from "./pages/QuizEdit.jsx";
import StudentJoin from "./pages/StudentJoin.jsx";
import StudentQuiz from "./pages/StudentQuiz.jsx";
import StudentResult from "./pages/StudentResult.jsx";

function App() {
	return (
		<Routes>
			{/* Main pages */}
			<Route path="/" element={<Home />} />
			<Route path="/nested/about/path" element={<About />} />
			{/* Mentor routes */}
			<Route path="/mentor/dashboard" element={<MentorDashboard />} />
			<Route path="/mentor/quiz/:quizId/edit" element={<QuizEdit />} />
			<Route path="/mentor/signup" element={<MentorSignup />} />
			<Route path="/mentor/login" element={<MentorLogin />} />
			{/* Student routes */}
			<Route path="/student/join" element={<StudentJoin />} />
			<Route path="/student/quiz/:quizId" element={<StudentQuiz />} />
			<Route path="/student/result/:quizId" element={<StudentResult />} />
		</Routes>
	);
}

export default App;
