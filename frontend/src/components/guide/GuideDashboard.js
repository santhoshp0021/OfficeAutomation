import React from 'react';
import { Link } from 'react-router-dom';

const GuideDashboard = () => {
  return (
    <div className="flex flex-col space-y-4">
      <Link to="/guide/guide-requests" className="block p-4 hover:bg-gray-100 rounded">
        Guide Requests
      </Link>
      <Link to="/guide/upload-attendance" className="block p-4 hover:bg-gray-100 rounded">
        Upload Attendance
      </Link>
    </div>
  );
};

export default GuideDashboard; 