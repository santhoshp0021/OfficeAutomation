import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HomePage from "./pages/student/homepage/homepage";
import GetStartedPage from "./pages/student/getstartedpage/getstartedpage";
import LoginPage from "./pages/student/loginpage/loginpage";
import FeedbackPage from "./pages/student/feedbackpage/feedbackpage";
import GrievancePage from "./pages/student/grievancepage/grievancepage";
import Dashboard from "./pages/admin/dashboard/dashboard";
import FacultyTable from "./pages/admin/faculties/Faculties";
import Grievances from "./pages/admin/grievances/Grievances";
import CSVUpload from "./pages/admin/csvupload/csvupload";
import AssignCourses from "./pages/admin/assigncourses/assigncourses";
import Courses from "./pages/admin/courses/Courses";
import Students from "./pages/admin/students/Students";
import Sidebar from "./components/sidebar/sidebar";
import NavBar from "./components/navbar/navbar";
import "./App.css";
import Unauthorized from "./pages/Unauthorized";
import FacultySelfPerformance from "./pages/faculty/FacultySelfPerformance";
import AssignElectiveFaculties from "./pages/admin/assigncourses/assignElectiveFaculties";
import ElectiveCourses from "./pages/admin/electivecourses/ElectiveCoursesStudentAssignment";
import AllElectiveCourses from "./pages/admin/electivecourses/AllElectiveCourses";
import ElectiveCoursesStudentAssignment from "./pages/admin/electivecourses/ElectiveCoursesStudentAssignment";

// Admin layout component
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
  return (
    <AuthProvider>
      <Router>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected student routes */}
            <Route
              path="/home"
              element={
                <ProtectedRoute requiredRole="student">
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute requiredRole="student">
                  <FeedbackPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/grievance"
              element={
                <ProtectedRoute requiredRole="student">
                  <GrievancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/getstarted"
              element={
                <ProtectedRoute requiredRole="student">
                  <GetStartedPage />
                </ProtectedRoute>
              }
            />

            {/* Protected admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                  >
                    <Dashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/csvupload"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                  >
                    <CSVUpload />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/assigncourses"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                  >
                    <AssignCourses />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/assign-elective-faculties"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                  >
                    <AssignElectiveFaculties />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/faculties"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                  >
                    <FacultyTable />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/grievances"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                  >
                    <Grievances />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                  >
                    <Courses />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                  >
                    <Students />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/elective-student-assignments"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                  >
                    <ElectiveCoursesStudentAssignment />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/elective-courses"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                  >
                    <AllElectiveCourses />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Faculty routes */}
            <Route
              path="/faculty/performance"
              element={
                <ProtectedRoute requiredRole="faculty">
                  <FacultySelfPerformance />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
