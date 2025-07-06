import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ClipboardList, 
  FileText, 
  DollarSign, 
  UserPlus
} from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/sessions', label: 'Sessions', icon: Calendar },
    { path: '/student-input', label: 'Student Input', icon: Users },
    { path: '/assign-qpsetter', label: 'Assign QP Setter', icon: UserPlus },
    { path: '/dashboard/seating-arrangement', label: 'Seating Arrangement', icon: ClipboardList },
    { path: '/duties', label: 'Duties', icon: FileText },
    { path: '/letters', label: 'Letters', icon: FileText },
    { path: '/claims', label: 'Claims', icon: DollarSign },
  ];

  return (
    <nav className="bg-white shadow-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#005A9C] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">PG</span>
                </div>
                <span className="text-xl font-semibold text-gray-800">PG Examinations</span>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:text-blue-700 hover:bg-gray-100'}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#005A9C]"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden" id="mobile-menu">
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700 hover:text-blue-700 hover:bg-gray-100'} mx-2`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 