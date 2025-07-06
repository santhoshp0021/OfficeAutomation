import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = ({ menuItems, theme = 'bg-gray-900 text-white', activeClass = 'bg-gray-700', children }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate('/');
  };
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className={`fixed z-30 top-0 left-0 h-full w-64 transition-transform duration-300 transform ${open ? 'translate-x-0' : '-translate-x-64'} ${theme}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <span className="text-xl font-bold">PG Examinations</span>
          <button onClick={() => setOpen(false)} className="text-2xl focus:outline-none">&lt;</button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map(item => (
            item.label === 'Logout' ? (
              <a
                key={item.path}
                href="/"
                onClick={handleLogout}
                className="block px-4 py-2 rounded transition-colors hover:bg-gray-800"
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
              </a>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded transition-colors ${isActive ? activeClass : 'hover:bg-gray-800'}`
                }
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
              </NavLink>
            )
          ))}
        </nav>
      </div>
      {/* Sidebar Toggle Button */}
      <button
        className={`fixed z-40 top-4 left-2 bg-white border rounded-full shadow p-1 ${open ? 'hidden' : ''}`}
        onClick={() => setOpen(true)}
      >
        <span className="text-xl">&#9776;</span>
      </button>
      {/* Main Content */}
      <div className="flex-1 ml-0 md:ml-64 transition-all duration-300 w-full">
        {children}
      </div>
    </div>
  );
};

export default Sidebar; 