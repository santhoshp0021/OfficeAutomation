import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaComments,
  FaUpload,
  FaBook,
  FaGraduationCap,
  FaWpforms,
  FaChevronDown,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";
import "./sidebar.css";

const Sidebar = ({ open, setSidebarOpen }) => {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState({
    management: true,
    assignments: true,
  });

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const isActive = (path) => location.pathname === path;

  // Function to handle link clicks on mobile
  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  // Function to handle cancel button click
  const handleCancelClick = () => {
    setSidebarOpen(false);
  };

  const menuGroups = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: FaHome,
      items: [
        { path: "/admin/dashboard", label: "Dashboard", icon: FaHome }
      ]
    },
    {
      id: "management",
      title: "Management",
      icon: FaUsers,
      items: [
        { path: "/admin/students", label: "Students", icon: FaGraduationCap },
        { path: "/admin/courses", label: "Courses", icon: FaBook },
        { path: "/admin/faculties", label: "Faculties", icon: FaUsers },
        { path: "/admin/grievances", label: "Grievances", icon: FaComments },
        { path: "/admin/elective-courses", label: "Elective Courses", icon: FaBook },
      ]
    },
    {
      id: "assignments",
      title: "Assignments",
      icon: FaWpforms,
      items: [
        { path: "/admin/assigncourses", label: "Assign Courses", icon: FaUsers },
        { path: "/admin/assign-elective-faculties", label: "Assign Elective Faculties", icon: FaWpforms },
        { path: "/admin/elective-student-assignments", label: "Elective Student Assignments", icon: FaBook },
      ]
    },
    {
      id: "utilities",
      title: "Utilities",
      icon: FaUpload,
      items: [
        { path: "/admin/csvupload", label: "CSV Upload", icon: FaUpload }
      ]
    }
  ];

  return (
    <div className={`sidebar ${open ? "open" : "closed"}`}>
      <div className="sidebar__profile">
        <div className="sidebar__profile-info">
          <div className="sidebar__name">Admin</div>
          <div className="sidebar__role">HOD</div>
        </div>
      </div>
      
      <nav className="sidebar__nav">
        {menuGroups.map((group) => (
          <div key={group.id} className="sidebar__group">
            {group.items.length > 1 ? (
              // Group with dropdown
              <div className="sidebar__group-container">
                <button
                  className={`sidebar__group-header ${expandedGroups[group.id] ? 'expanded' : ''}`}
                  onClick={() => toggleGroup(group.id)}
                  title={!open ? group.title : ''}
                >
                  {React.createElement(group.icon, { className: 'sidebar__icon' })}
                  {open && <span className="sidebar__group-title">{group.title}</span>}
                  {open && (
                    expandedGroups[group.id] ? 
                    <FaChevronDown className="sidebar__chevron" /> : 
                    <FaChevronRight className="sidebar__chevron" />
                  )}
                </button>
                
                {expandedGroups[group.id] && (
                  <div className="sidebar__group-items">
                    {group.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`sidebar__link ${isActive(item.path) ? 'active' : ''}`}
                        title={!open ? item.label : ''}
                        onClick={handleLinkClick}
                      >
                        {React.createElement(item.icon, { className: 'sidebar__icon' })}
                        {open && <span>{item.label}</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Single item (no dropdown)
              <Link
                to={group.items[0].path}
                className={`sidebar__link ${isActive(group.items[0].path) ? 'active' : ''}`}
                title={!open ? group.items[0].label : ''}
                onClick={handleLinkClick}
              >
                {React.createElement(group.items[0].icon, { className: 'sidebar__icon' })}
                {open && <span>{group.items[0].label}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>
      {/* Cancel button for mobile screens */}
      {open && (
        <button className="sidebar__cancel" onClick={handleCancelClick}>
          <FaTimes className="sidebar__cancel-icon" />
        </button>
      )}
    </div>
  );
};

export default Sidebar;
