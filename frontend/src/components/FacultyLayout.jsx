import React from 'react';
import Sidebar from './layouts/PageLayout';
import { Outlet } from 'react-router-dom';

const menuItems = [
  { path: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { path: 'assigned-courses', label: 'View Assigned Courses', icon: '📚' },
  { path: 'qp-orders', label: 'View/Download QP Orders', icon: '📄' },
  { path: 'invigilation-duty', label: 'View Invigilation Duty', icon: '👥' },
  { path: '/logout', label: 'Logout', icon: '🚪' },
];

const FacultyLayout = () => (
  <Sidebar menuItems={menuItems} theme="bg-white text-gray-900" activeClass="bg-blue-100 text-blue-700">
    <div className="p-8">
      <Outlet />
    </div>
  </Sidebar>
);

export default FacultyLayout; 