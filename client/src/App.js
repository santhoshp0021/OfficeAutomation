import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import RoleSelect from './pages/RoleSelect';
import FacultyDashboard from './components/FacultyDashboard';
import FacultyWelcome from './pages/faculty/FacultyWelcome';
import AssignedCourses from './pages/faculty/AssignedCourses';
import QPOrders from './pages/faculty/QPOrders';
import FacultyInvigilationDuty from './pages/faculty/InvigilationDuty';
import EvaluatorDetails from './pages/faculty/EvaluatorDetails';
import ReleaseClaim from './pages/faculty/ReleaseClaim';
import StudentInput from './pages/StudentInput';
import SessionView from './pages/SessionView';
import AdminInvigilationDuty from './pages/InvigilationDuty';
import Claims from './pages/Claims';
import UserManagement from './pages/UserManagement';
import HODDashboard from './components/HODDashboard';
import ConsolidatedSessions from './pages/hod/ConsolidatedSessions';
import AssignQpSetter from './pages/hod/AssignQpSetter';
import Letters from './pages/hod/FinalReports';
import SignOff from './pages/hod/SignOff';
import FacultyLayout from './components/FacultyLayout';
import HODLayout from './components/HODLayout';
import HODWelcome from './pages/hod/HODWelcome';
import FacultyLogin from './pages/faculty/FacultyLogin';
import SeatingArrangement from './pages/SeatingArrangement';
import AssignQPSetterTopLevel from './pages/assign-qpsetter';
import DutyAssignment from './pages/DutyAssignment';
import AnswerSheetRequest from './pages/AnswerSheetRequest';
import SettlementAllPages from './pages/SettlementAllPages';
import AboutPage from './pages/AboutPage';

// Create a wrapper component to handle role-based routing
const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    // Redirect to role selection if no role is set
    if (!userRole && location.pathname !== '/') {
      navigate('/');
    }
    // Redirect based on role
    else if (userRole === 'Faculty' && location.pathname === '/dashboard') {
      navigate('/faculty/dashboard');
    }
    else if (userRole === 'HOD' && location.pathname === '/dashboard') {
      navigate('/hod/dashboard');
    }
    else if (userRole === 'Admin' && location.pathname === '/dashboard') {
      navigate('/admin/dashboard');
    }
  }, [userRole, location.pathname, navigate]);

  // Show navbar for non-dashboard, non-faculty, non-hod pages
  const dashboardPaths = [
    '/dashboard', '/sessions', '/student-input', '/assign-qpsetter', '/dashboard/seating-arrangement', '/duties', '/claims', '/letters', '/users', '/settlement-all-pages'
  ];
  const showNavbar = location.pathname !== '/' &&
    location.pathname !== '/about' &&
    !location.pathname.startsWith('/faculty') &&
    !location.pathname.startsWith('/hod') &&
    !dashboardPaths.includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<RoleSelect />} />
          
          {/* Main Dashboard Route */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<AboutPage />} />
          
          {/* HOD Routes */}
          <Route path="/hod" element={<HODLayout />}>
            <Route path="dashboard" element={<HODWelcome />} />
            <Route path="consolidated-sessions" element={<ConsolidatedSessions />} />
            <Route path="assign-qpsetter" element={<AssignQpSetter />} />
            <Route path="letters" element={<Letters />} />
            <Route path="signoff" element={<SignOff />} />
          </Route>

          {/* Faculty Routes */}
          <Route path="/faculty/login" element={<FacultyLogin />} />
          <Route path="/faculty" element={<FacultyLayout />}>
            <Route path="dashboard" element={<FacultyDashboard />}>
              <Route index element={<FacultyWelcome />} />
            </Route>
            <Route path="assigned-courses" element={<AssignedCourses />} />
            <Route path="qp-orders" element={<QPOrders />} />
            <Route path="invigilation-duty" element={<FacultyInvigilationDuty />} />
            <Route path="evaluator-details" element={<EvaluatorDetails />} />
            <Route path="release-claim" element={<ReleaseClaim />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/student-input" element={<StudentInput />} />
          <Route path="/sessions" element={<SessionView />} />
          <Route path="/duties" element={<DutyAssignment />} />
          <Route path="/claims" element={<Claims />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/dashboard/seating-arrangement" element={<SeatingArrangement />} />
          <Route path="/assign-qpsetter" element={<AssignQPSetterTopLevel />} />
          <Route path="/letters" element={<AnswerSheetRequest />} />
          <Route path="/settlement-all-pages" element={<SettlementAllPages />} />
        </Routes>
      </div>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;