import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LogoutButton = ({ className = "", style = {} }) => {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {currentUser && (
        <span className="welcome-message-desktop" style={{ fontSize: '14px', color: '#6c757d' }}>
          Welcome, {currentUser.name} ({currentUser.role})
        </span>
      )}
      <button
        onClick={handleLogout}
        className={className}
        style={{
          padding: '8px 16px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          ...style
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default LogoutButton; 