import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [facultyName, setFacultyName] = useState('');

  useEffect(() => {
    const loggedInFaculty = localStorage.getItem('loggedInFaculty');
    if (!loggedInFaculty) {
      navigate('/faculty/login');
      return;
    }

    const facultyData = JSON.parse(loggedInFaculty);
    setFacultyName(facultyData.name);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Welcome, {facultyName}
        </h1>
        {/* Add your dashboard content here */}
      </div>
    </div>
  );
};

export default FacultyDashboard; 