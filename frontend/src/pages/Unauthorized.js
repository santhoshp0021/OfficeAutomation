import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#f8f9fa',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '500px'
      }}>
        <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>
          ⚠️ Access Denied
        </h1>
        
        <p style={{ fontSize: '18px', marginBottom: '20px', color: '#6c757d' }}>
          Sorry, you don't have permission to access this page.
        </p>
        
        {currentUser && (
          <div style={{ 
            background: '#e9ecef', 
            padding: '15px', 
            borderRadius: '4px', 
            marginBottom: '20px' 
          }}>
            <p style={{ margin: '0', fontSize: '14px', color: '#495057' }}>
              <strong>Current User:</strong> {currentUser.name} ({currentUser.role})
            </p>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={handleGoBack}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Go Back
          </button>
          
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 