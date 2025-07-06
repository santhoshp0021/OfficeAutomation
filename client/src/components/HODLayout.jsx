import React from 'react';
import Sidebar from './layouts/PageLayout';
import { Outlet } from 'react-router-dom';

const menuItems = [
  { path: '/hod/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/hod/consolidated-sessions', label: 'View Consolidated Sessions', icon: '📊' },
  { path: '/hod/assign-qpsetter', label: 'Assign Faculty for QP Setting', icon: '👥' },
  { path: '/hod/letters', label: 'View Letters', icon: '📈' },
  { path: '/logout', label: 'Logout', icon: '🚪' },
];

const HODLayout = () => (
  <Sidebar menuItems={menuItems} theme="bg-white text-gray-900" activeClass="bg-blue-100 text-blue-700">
    <div className="p-8">
      <Outlet />
    </div>
  </Sidebar>
);

export default HODLayout;