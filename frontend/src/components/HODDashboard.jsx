import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const HODDashboard = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  const handleGoBack = () => {
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const menuItems = [
    { path: '', label: 'Dashboard', icon: '🏠' },
    { path: 'consolidated-sessions', label: 'View Consolidated Sessions', icon: '📊' },
    { path: 'assign-qpsetter', label: 'Assign Faculty for QP Setting', icon: '👥' },
    { path: 'approve-qporders', label: 'Approve QP Order Letters', icon: '📋' },
    { path: 'letters', label: 'View Letters', icon: '📈' },
  
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">HOD Dashboard</h2>
            <button
              onClick={handleGoBack}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
          </div>
          <nav>
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-2 p-3 mb-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default HODDashboard; 