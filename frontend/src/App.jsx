import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";

// Context
import { useAuth } from "./contexts/AuthContext";

// Notifications
import { Toaster } from "react-hot-toast";

// Layout
import Sidebar from "./components/sidebar/sidebar";
import NavBar from "./components/navbar/navbar";

// Protected routing
import ProtectedRoutes from "./ui/ProtectedRoutes";

// Theme and Date Picker
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// Common Pages
import Unauthorized from "./pages/Unauthorized";
import FacultyLogin from "./pages/Faculty/Login";
import Signup from "./pages/Faculty/Signup";
import Home from "./pages/Home";

// Student Pages
import HomePage from "./pages/student/homepage/homepage";
import GetStartedPage from "./pages/student/getstartedpage/getstartedpage";
import FeedbackPage from "./pages/student/feedbackpage/feedbackpage";
import GrievancePage from "./pages/student/grievancepage/grievancepage";
import ODRequestForm from "./components/ODRequestForm";
import ODRequestList from "./components/ODRequestList";

// Faculty Pages
import Dashboard from "./pages/Faculty/Dashboard";
import FacultyODRequestList from "./components/FacultyODRequestList";
import FacultyScholars from "./Features/Scholars/Scholars";
import AddScholar from "./Features/Scholars/AddScholar";
import ODHistory from "./Features/OD/ODHistory";
import ODRequest from "./Features/OD/ODRequest";
import Publications from "./Features/Publications/Publications";
import AddPublication from "./Features/Publications/AddPublication";
import GenerateCR from "./Features/CR/GenerateCR";
import AllCRReports from "./Features/CR/ViewAllReports";
import FullReport from "./Features/CR/FullReport";
import FacultySelfPerformance from "./pages/faculty/FacultySelfPerformance";

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

// HOD Page
import HODDashboard from "./components/HODDashboard";

// Landing and Register from original app
import LandingPage from "./components/LandingPage";
import Register from "./components/Register";
import AdminManagement from "./components/AdminManagement";

const AdminLayout = ({ sidebarOpen, setSidebarOpen, children }) => (
  <div className="app-container">
    <Sidebar open={sidebarOpen} setSidebarOpen={setSidebarOpen} />
    <div className="right-content">
      <NavBar onHamburgerClick={() => setSidebarOpen(!sidebarOpen)} />
      {children}
    </div>
  </div>
);

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser: user } = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
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
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />

            {/* Home layout always visible, only nested routes protected */}
            <Route path="/" element={<Home />}>
              <Route path="/login" element={<FacultyLogin />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/register" element={<Register />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route
                index
                element={
                  <ProtectedRoutes>
                    <Dashboard />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="scholars"
                element={
                  <ProtectedRoutes>
                    <FacultyScholars />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="scholar/add"
                element={
                  <ProtectedRoutes>
                    <AddScholar />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="OD"
                element={
                  <ProtectedRoutes>
                    <ODHistory />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="OD/new"
                element={
                  <ProtectedRoutes>
                    <ODRequest />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="faculty/od-requests"
                element={
                  <ProtectedRoutes>
                    <FacultyODRequestList />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="publications"
                element={
                  <ProtectedRoutes>
                    <Publications />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="publication/add"
                element={
                  <ProtectedRoutes>
                    <AddPublication />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="CR"
                element={
                  <ProtectedRoutes>
                    <GenerateCR />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="CR/view"
                element={
                  <ProtectedRoutes>
                    <AllCRReports />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="CR/fullReport/:reportId"
                element={
                  <ProtectedRoutes>
                    <FullReport user={user} />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="faculty/performance"
                element={
                  <ProtectedRoutes>
                    <FacultySelfPerformance />
                  </ProtectedRoutes>
                }
              />

              {/* Student */}
              <Route
                path="home"
                element={
                  <ProtectedRoutes>
                    <HomePage />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="getstarted"
                element={
                  <ProtectedRoutes>
                    <GetStartedPage />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="feedback"
                element={
                  <ProtectedRoutes>
                    <FeedbackPage />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="grievance"
                element={
                  <ProtectedRoutes>
                    <GrievancePage />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="student/od-request"
                element={
                  <ProtectedRoutes>
                    <ODRequestForm />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="student/my-requests"
                element={
                  <ProtectedRoutes>
                    <ODRequestList />
                  </ProtectedRoutes>
                }
              />

              {/* HOD */}
              <Route
                path="hod/dashboard"
                element={
                  <ProtectedRoutes>
                    <HODDashboard />
                  </ProtectedRoutes>
                }
              />

              {/* Admin */}
              <Route
                path="admin/dashboard"
                element={
                  <ProtectedRoutes>
                    <AdminDashboard />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="admin/management"
                element={
                  <ProtectedRoutes>
                    <AdminManagement />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="admin/csvupload"
                element={
                  <ProtectedRoutes>
                    <CSVUpload />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="admin/assigncourses"
                element={
                  <ProtectedRoutes>
                    <AssignCourses />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="admin/assign-elective-faculties"
                element={
                  <ProtectedRoutes>
                    <AssignElectiveFaculties />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="admin/faculties"
                element={
                  <ProtectedRoutes>
                    <FacultyTable />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="admin/grievances"
                element={
                  <ProtectedRoutes>
                    <Grievances />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="admin/courses"
                element={
                  <ProtectedRoutes>
                    <Courses />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="admin/students"
                element={
                  <ProtectedRoutes>
                    <Students />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="admin/elective-courses"
                element={
                  <ProtectedRoutes>
                    <AllElectiveCourses />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="admin/elective-student-assignments"
                element={
                  <ProtectedRoutes>
                    <ElectiveCoursesStudentAssignment />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="admin/consolidation-report"
                element={
                  <ProtectedRoutes>
                    <ConsolidationReportMenu />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="admin/consolidation-report/menu"
                element={
                  <ProtectedRoutes>
                    <ConsolidationReportMenu />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="admin/consolidation-report/scholars"
                element={
                  <ProtectedRoutes>
                    <ConsolidationReportScholars />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="admin/consolidation-report/OD"
                element={
                  <ProtectedRoutes>
                    <ConsolidationReportOD />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="admin/consolidation-report/faculty"
                element={
                  <ProtectedRoutes>
                    <ConsolidationReportFaculty />
                  </ProtectedRoutes>
                }
              />
              <Route
                path="admin/consolidation-report/faculty/:facultyName"
                element={
                  <ProtectedRoutes>
                    <ConsolidationReportFacultyAnalytics />
                  </ProtectedRoutes>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
