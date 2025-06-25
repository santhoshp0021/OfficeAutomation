import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const roleLabels = {
  guide: 'Guide',
  panel: 'Panel Member',
  coordinator: 'Coordinator',
};

const FacultyDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const [selected, setSelected] = useState({
    role: '',
    team: '',
  });

  // Get all faculty roles (guide, panel, coordinator)
  const facultyRoles = user.roles.filter(r => ['guide', 'panel', 'coordinator'].includes(r.role));

  // Group by role for dropdown
  const grouped = facultyRoles.reduce((acc, r) => {
    if (!acc[r.role]) acc[r.role] = [];
    acc[r.role].push(r);
    return acc;
  }, {});

  const handleSelect = (role, team) => {
    setSelected({ role, team });
    // Save selected role/team in localStorage for use in dashboards
    localStorage.setItem('selectedRole', JSON.stringify({ role, team }));
    // Also update user object in localStorage for ProtectedRoute
    const user = JSON.parse(localStorage.getItem('user'));
    user.role = role;
    user.team = team;
    localStorage.setItem('user', JSON.stringify(user));
    // Redirect to the appropriate dashboard
    if (role === 'guide') navigate('/guide-dashboard');
    else if (role === 'panel') navigate('/panel-dashboard');
    else if (role === 'coordinator') navigate('/coordinator-dashboard/review-schedule');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-4">
          Welcome, {user.name}
        </h2>
        <p className="text-center text-gray-700 mb-6">
          You have multiple roles. Please select which dashboard you want to access:
        </p>
        <div className="space-y-4">
          {Object.entries(grouped).map(([role, arr]) => (
            <div key={role}>
              <div className="font-semibold mb-1">{roleLabels[role]}</div>
              {arr.map((r, idx) => (
                <button
                  key={idx}
                  className="w-full mb-2 py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none"
                  onClick={() => handleSelect(role, r.team)}
                >
                  {roleLabels[role]}{r.team ? ` for ${r.team}` : ''}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard; 