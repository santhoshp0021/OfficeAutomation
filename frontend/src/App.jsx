import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoleSelect from './pages/RoleSelect';
import FacultyLogin from './pages/faculty/FacultyLogin';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import AssignedCourses from './pages/faculty/AssignedCourses';
import QPOrders from './pages/faculty/QPOrders';
import UploadQuestionPaper from './pages/faculty/UploadQuestionPaper';
import InvigilationDuty from './pages/faculty/InvigilationDuty';
import EvaluatorDetails from './pages/faculty/EvaluatorDetails';
import ReleaseClaim from './pages/faculty/ReleaseClaim';
import ProtectedFacultyRoute from './components/ProtectedFacultyRoute';
import HODWelcome from './pages/hod/HODWelcome';
import ConsolidatedSessions from './pages/hod/ConsolidatedSessions';
import AssignQpSetter from './pages/hod/AssignQpSetter';
import FinalReports from './pages/hod/FinalReports';
import Signoff from './pages/hod/Signoff';
import ProtectedHODRoute from './components/ProtectedHODRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Home/Role Selection */}
        <Route path="/" element={<RoleSelect />} />
        
        {/* Faculty Routes */}
        <Route path="faculty">
          <Route path="login" element={<FacultyLogin />} />
          <Route path="dashboard" element={
            <ProtectedFacultyRoute>
              <FacultyDashboard />
            </ProtectedFacultyRoute>
          } />
          <Route path="assigned-courses" element={
            <ProtectedFacultyRoute>
              <AssignedCourses />
            </ProtectedFacultyRoute>
          } />
          <Route path="qp-orders" element={
            <ProtectedFacultyRoute>
              <QPOrders />
            </ProtectedFacultyRoute>
          } />
          <Route path="upload-question-paper" element={
            <ProtectedFacultyRoute>
              <UploadQuestionPaper />
            </ProtectedFacultyRoute>
          } />
          <Route path="invigilation-duty" element={
            <ProtectedFacultyRoute>
              <InvigilationDuty />
            </ProtectedFacultyRoute>
          } />
          <Route path="evaluator-details" element={
            <ProtectedFacultyRoute>
              <EvaluatorDetails />
            </ProtectedFacultyRoute>
          } />
          <Route path="release-claim" element={
            <ProtectedFacultyRoute>
              <ReleaseClaim />
            </ProtectedFacultyRoute>
          } />
        </Route>

        {/* HOD Routes */}
        <Route path="hod">
          <Route path="dashboard" element={
            <ProtectedHODRoute>
              <HODWelcome />
            </ProtectedHODRoute>
          } />
          <Route path="consolidated-sessions" element={
            <ProtectedHODRoute>
              <ConsolidatedSessions />
            </ProtectedHODRoute>
          } />
          <Route path="assign-qpsetter" element={
            <ProtectedHODRoute>
              <AssignQpSetter />
            </ProtectedHODRoute>
          } />
          <Route path="letters" element={
            <ProtectedHODRoute>
              <FinalReports />
            </ProtectedHODRoute>
          } />
          <Route path="signoff" element={
            <ProtectedHODRoute>
              <Signoff />
            </ProtectedHODRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App; 