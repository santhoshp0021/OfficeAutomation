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
  FaSignOutAlt,
  FaUserPlus,
  FaClipboardList,
  FaPlus,
  FaEdit,
} from "react-icons/fa";
import "./sidebar.css";
import { useAuth } from "../../contexts/AuthContext";

const Sidebar = ({ open, setSidebarOpen }) => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const role = currentUser?.role;
  const [expandedGroups, setExpandedGroups] = useState({
    dashboard: true,
    management: true,
    assignments: true,
    scholar: true,
    publication: true,
    od: true,
    adminTools: true,
  });

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const isActive = (path) => location.pathname === path;

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleCancelClick = () => {
    setSidebarOpen(false);
  };

  const menuGroups = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: FaHome,
      roles: ["admin", "faculty"],
      items: [
        { path: "/", label: "Home", icon: FaHome, roles: ["all"] },
      ],
    },
    {
      id: "management",
      title: "Management",
      icon: FaUsers,
      roles: ["admin"],
      items: [
        { path: "/admin/students", label: "Students", icon: FaGraduationCap },
        { path: "/admin/courses", label: "Courses", icon: FaBook },
        { path: "/admin/faculties", label: "Faculties", icon: FaUsers },
        { path: "/admin/grievances", label: "Grievances", icon: FaComments },
        { path: "/admin/elective-courses", label: "Elective Courses", icon: FaBook },
      ],
    },
    {
      id: "assignments",
      title: "Assignments",
      icon: FaWpforms,
      roles: ["admin"],
      items: [
        { path: "/admin/assigncourses", label: "Assign Courses", icon: FaUsers },
        { path: "/admin/assign-elective-faculties", label: "Assign Elective Faculties", icon: FaWpforms },
        { path: "/admin/elective-student-assignments", label: "Elective Student Assignments", icon: FaBook },
      ],
    },
    {
      id: "scholar",
      title: "Scholars",
      icon: FaGraduationCap,
      roles: ["admin", "faculty"],
      items: [
        { path: "/scholars", label: "View Scholars", icon: FaUsers },
        { path: "/scholar/add", label: "Add Scholar", icon: FaUserPlus, roles: ["faculty"] },
      ],
    },
    {
      id: "publication",
      title: "Publications",
      icon: FaBook,
      roles: ["admin", "faculty"],
      items: [
        { path: "/publications", label: "View Publications", icon: FaBook },
        { path: "/publication/add", label: "Add Publication", icon: FaPlus, roles: ["faculty"] },
      ],
    },
    {
      id: "od",
      title: "OD Requests",
      icon: FaClipboardList,
      roles: ["admin", "faculty"],
      items: [
        { path: "/OD", label: "OD History", icon: FaClipboardList },
        { path: "/OD/new", label: "New OD Request", icon: FaWpforms, roles: ["faculty"] },
      ],
    },
    {
      id: "adminTools",
      title: "Admin Tools",
      icon: FaUpload,
      roles: ["admin"],
      items: [
        { path: "/admin/csvupload", label: "CSV Upload", icon: FaUpload },
        { path: "/admin/consolidation-report/menu", label: "CR Consolidation", icon: FaEdit },
      ],
    },
    {
      id: "logout",
      title: "Logout",
      icon: FaSignOutAlt,
      roles: ["all"],
      items: [
        {
          path: "/login",
          label: "Logout",
          icon: FaSignOutAlt,
          onClick: logout,
        },
      ],
    },
  ];

  return (
    <div className={`sidebar ${open ? "open" : "closed"}`}>
      <div className="sidebar__profile">
        <div className="sidebar__profile-info">
          <div className="sidebar__name">{currentUser?.name}</div>
          <div className="sidebar__role">{currentUser?.role?.toUpperCase()}</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {menuGroups
          .filter((group) => group.roles.includes("all") || group.roles.includes(role))
          .map((group) => (
            <div key={group.id} className="sidebar__group">
              {group.items.length > 1 ? (
                <div className="sidebar__group-container">
                  <button
                    className={`sidebar__group-header ${expandedGroups[group.id] ? "expanded" : ""}`}
                    onClick={() => toggleGroup(group.id)}
                    title={!open ? group.title : ""}
                  >
                    {React.createElement(group.icon, { className: "sidebar__icon" })}
                    {open && <span className="sidebar__group-title">{group.title}</span>}
                    {open &&
                      (expandedGroups[group.id] ? (
                        <FaChevronDown className="sidebar__chevron" />
                      ) : (
                        <FaChevronRight className="sidebar__chevron" />
                      ))}
                  </button>

                  {expandedGroups[group.id] && (
                    <div className="sidebar__group-items">
                      {group.items
                        .filter((item) => !item.roles || item.roles.includes(role) || item.roles?.includes("all"))
                        .map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`sidebar__link ${isActive(item.path) ? "active" : ""}`}
                            title={!open ? item.label : ""}
                            onClick={() => {
                              handleLinkClick();
                              if (item.onClick) item.onClick(); // e.g., logout
                            }}
                          >
                            {React.createElement(item.icon, { className: "sidebar__icon" })}
                            {open && <span>{item.label}</span>}
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={group.items[0].path}
                  className={`sidebar__link ${isActive(group.items[0].path) ? "active" : ""}`}
                  title={!open ? group.items[0].label : ""}
                  onClick={() => {
                    handleLinkClick();
                    if (group.items[0].onClick) group.items[0].onClick();
                  }}
                >
                  {React.createElement(group.items[0].icon, { className: "sidebar__icon" })}
                  {open && <span>{group.items[0].label}</span>}
                </Link>
              )}
            </div>
          ))}
      </nav>

      {open && (
        <button className="sidebar__cancel" onClick={handleCancelClick}>
          <FaTimes className="sidebar__cancel-icon" />
        </button>
      )}
    </div>
  );
};

export default Sidebar;
