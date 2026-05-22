import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import ProjectorListingPage from './pages/ProjectorListingPage';
import RoomListingPage from './pages/RoomListingPage';
import HallListingPage from './pages/HallListingPage';
import AuditoriumRequest from './pages/AuditoriumRequest';
import Messages from './pages/Messages';
import FacilitywiseBooking from './pages/FacilitywiseBooking';
import Requestspage from './pages/Admin/Requestspage';
import Historypage from './pages/Admin/Historypage';
import Dashboard from './pages/Admin/Dashboard';
import EnrollmentPage from './pages/Admin/EnrollmentPage';
import TimeTable from './pages/Admin/TimeTable';
import Facilities from './pages/Admin/Facilities';
import Register from './pages/Admin/Register';

function ProtectedRoute({ user, children, roles }) {
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/home" replace />;
  return children;
}

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/home" element={<ProtectedRoute user={user}><HomePage user={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/booking" element={<ProtectedRoute user={user} roles={['student', 'student_rep']}><BookingPage user={user} /></ProtectedRoute>} />
        <Route path="/rooms" element={<ProtectedRoute user={user} roles={['faculty', 'student_rep', 'secretary', 'admin']}><RoomListingPage user={user} /></ProtectedRoute>} />
        <Route path="/projectorlisting" element={<ProtectedRoute user={user} roles={['faculty', 'student_rep', 'secretary', 'admin']}><ProjectorListingPage /></ProtectedRoute>} />
        <Route path="/halls" element={<ProtectedRoute user={user} roles={['faculty', 'student_rep', 'secretary']}><HallListingPage user={user} /></ProtectedRoute>} />
        <Route path="/auditorium" element={<ProtectedRoute user={user} roles={['secretary']}><AuditoriumRequest user={user} /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute user={user} roles={['faculty', 'student_rep', 'secretary', 'student']}><Messages user={user} /></ProtectedRoute>} />
        <Route path="/facilitywiseBooking" element={<ProtectedRoute user={user} roles={['faculty', 'student_rep', 'secretary']}><FacilitywiseBooking user={user} /></ProtectedRoute>} />
        <Route path="/requests" element={<ProtectedRoute user={user} roles={['admin']}><Requestspage user={user} /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute user={user} roles={['admin']}><Historypage user={user} /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute user={user} roles={['admin']}><Dashboard user={user} /></ProtectedRoute>} />
        <Route path="/enrollment" element={<ProtectedRoute user={user} roles={['admin']}><EnrollmentPage user={user} /></ProtectedRoute>} />
        <Route path="/timetable" element={<ProtectedRoute user={user} roles={['admin']}><TimeTable user={user} /></ProtectedRoute>} />
        <Route path="/facilities" element={<ProtectedRoute user={user} roles={['admin']}><Facilities user={user} /></ProtectedRoute>} />
        <Route path="/register" element={<ProtectedRoute user={user} roles={['admin']}><Register user={user} /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={user ? '/home' : '/'} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
