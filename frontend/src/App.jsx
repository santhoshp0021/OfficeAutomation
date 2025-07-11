import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import "./App.css";

// Contexts
import { useAuth } from "./contexts/AuthContext";
// Notifications
import { Toaster } from "react-hot-toast";

// Protected Routes
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedRoutes from "./ui/ProtectedRoutes";

// Admin Layout
import Sidebar from "./components/sidebar/sidebar";
import NavBar from "./components/navbar/navbar";
const AdminLayout = ({ sidebarOpen, setSidebarOpen, children }) => (
  <div className="app-container">
    <Sidebar open={sidebarOpen} setSidebarOpen={setSidebarOpen} />
    <div className="right-content">
      <NavBar onHamburgerClick={() => setSidebarOpen(!sidebarOpen)} />
      {children}
    </div>
  </div>
);

// Common Pages
import Home from "./pages/Home";
import Unauthorized from "./pages/Unauthorized";
import FacultyLogin from "./pages/Faculty/Login";
import Signup from "./pages/Faculty/Signup";
import Dashboard from "./pages/Faculty/Dashboard";

// Faculty Features
import ODRequest from "./Features/OD/ODRequest";
import ODHistory from "./Features/OD/ODHistory";
import AddPublication from "./Features/Publications/AddPublication";
import Publications from "./Features/Publications/Publications";
import AddScholar from "./Features/Scholars/AddScholar";
import FacultyScholars from "./Features/Scholars/Scholars";
import GenerateCR from "./Features/CR/GenerateCR";
import AllCRReports from "./Features/CR/ViewAllReports";
import FullReport from "./Features/CR/FullReport";

// Admin Pages
import AdminDashboard from "./pages/admin/dashboard/dashboard";
import FacultyTable from "./pages/admin/faculties/Faculties";
import Grievances from "./pages/admin/grievances/Grievances";
import CSVUpload from "./pages/admin/csvupload/csvupload";
import AssignCourses from "./pages/admin/assigncourses/assigncourses";
import AssignElectiveFaculties from "./pages/admin/assigncourses/assignElectiveFaculties";
import Courses from "./pages/admin/courses/Courses";
import Students from "./pages/admin/students/Students";
import AllElectiveCourses from "./pages/admin/electivecourses/AllElectiveCourses";
import ElectiveCoursesStudentAssignment from "./pages/admin/electivecourses/ElectiveCoursesStudentAssignment";
import {
  ConsolidationReportMenu,
  ConsolidationReportScholars,
  ConsolidationReportOD,
} from "./pages/Admin/ConsolidationReport";
import ConsolidationReportFaculty from "./pages/Admin/ConsolidationReportFaculty";
import ConsolidationReportFacultyAnalytics from "./pages/Admin/ConsolidationReportFacultyAnalytics";

// Student Pages
import HomePage from "./pages/student/homepage/homepage";
import GetStartedPage from "./pages/student/getstartedpage/getstartedpage";
import LoginPage from "./pages/student/loginpage/loginpage";
import FeedbackPage from "./pages/student/feedbackpage/feedbackpage";
import GrievancePage from "./pages/student/grievancepage/grievancepage";

// Faculty Self Performance
import FacultySelfPerformance from "./pages/faculty/FacultySelfPerformance";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser: user } = useAuth();

  return (
      <Router>
        <Toaster
          position="top-right"
          containerStyle={{ margin: "10px" }}
          toastOptions={{
            success: { duration: 3000 },
            error: { duration: 5000 },
            style: {
              fontSize: "16px",
              maxWidth: "500px",
              padding: "16px 24px",
              backgroundColor: "#ffffff",
              color: "var(--color-grey-700)",
            },
          }}
        />

        <Routes>
            {/* Public */}
            <Route path="/login" element={<FacultyLogin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* All protected routes under Home */}
            <Route
              path="/"
              element={
                <ProtectedRoutes>
                  <Home />
                </ProtectedRoutes>
              }
            >
              {/* Faculty */}
              <Route index element={<Dashboard />} />
              <Route path="scholars" element={<FacultyScholars />} />
              <Route path="scholar/add" element={<AddScholar />} />
              <Route path="OD" element={<ODHistory />} />
              <Route path="OD/new" element={<ODRequest />} />
              <Route path="publications" element={<Publications />} />
              <Route path="publication/add" element={<AddPublication />} />
              <Route path="CR" element={<GenerateCR />} />
              <Route path="CR/view" element={<AllCRReports />} />
              <Route path="CR/fullReport/:reportId" element={<FullReport user={user}/>} />
              <Route path="faculty/performance" element={<FacultySelfPerformance />} />

              {/* Admin */}
              <Route path="admin/dashboard" element={<AdminDashboard />} />
              <Route path="admin/csvupload" element={<CSVUpload />} />
              <Route path="admin/assigncourses" element={<AssignCourses />} />
              <Route path="admin/assign-elective-faculties" element={<AssignElectiveFaculties />} />
              <Route path="admin/faculties" element={<FacultyTable />} />
              <Route path="admin/grievances" element={<Grievances />} />
              <Route path="admin/courses" element={<Courses />} />
              <Route path="admin/students" element={<Students />} />
              <Route path="admin/elective-courses" element={<AllElectiveCourses />} />
              <Route path="admin/elective-student-assignments" element={<ElectiveCoursesStudentAssignment />} />
              <Route path="admin/consolidation-report" element={<ConsolidationReportMenu />} />
              <Route path="admin/consolidation-report/menu" element={<ConsolidationReportMenu />} />
              <Route path="admin/consolidation-report/scholars" element={<ConsolidationReportScholars />} />
              <Route path="admin/consolidation-report/OD" element={<ConsolidationReportOD />} />
              <Route path="admin/consolidation-report/faculty" element={<ConsolidationReportFaculty />} />
              <Route path="admin/consolidation-report/faculty/:facultyName" element={<ConsolidationReportFacultyAnalytics />} />

              {/* Student */}
              <Route path="home" element={<HomePage />} />
              <Route path="getstarted" element={<GetStartedPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="grievance" element={<GrievancePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

      </Router>
  );
}

export default App;
