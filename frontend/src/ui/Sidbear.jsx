import React, { useState } from "react";
import {
  TbLayoutSidebarLeftCollapseFilled,
  TbLayoutSidebarRightCollapseFilled,
  TbHome,
  TbUser,
  TbBook,
  TbFilePlus,
  TbHistory,
  TbUserPlus,
  TbReport,
  TbLogout2,
  TbBookUpload,
  TbLogin2,
  TbChevronDown,
  TbChevronRight,
  TbUpload,
} from "react-icons/tb";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const { currentUser: user, logout } = useAuth();
  const isFaculty = user?.role === "faculty";
  const isAdmin = user?.role === "admin";

  const [expandedSections, setExpandedSections] = useState({
    scholar: true,
    publication: true,
    od: true,
    admin: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const Section = ({ title, icon, id, children }) => {
    const expanded = expandedSections[id];
    return (
      <div className="my-1">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between text-left px-4 py-2 hover:text-[#fee199] font-semibold"
        >
          <span className="flex items-center gap-2">
            {icon} {open && title}
          </span>
          {open && (expanded ? <TbChevronDown /> : <TbChevronRight />)}
        </button>
        {expanded && (
          <ul className="pl-6">
            {children}
          </ul>
        )}
      </div>
    );
  };

  const LinkItem = ({ to, icon, label, onClick }) => (
    <li className="my-1">
      <NavLink
        to={to}
        onClick={() => {
          if (onClick) onClick();
        }}
        className={({ isActive }) =>
          `flex items-center gap-2 px-2 py-1 text-[#F9F6F0] hover:text-[#fee199] ${
            isActive ? "font-bold" : ""
          }`
        }
      >
        {icon}
        {open && <span>{label}</span>}
      </NavLink>
    </li>
  );

  return (
    <div
      className={`fixed top-0 left-0 z-[1000] h-screen bg-[#145DA0] text-white transition-all duration-300 ${
        open ? "w-72" : "w-8"
      }`}
    >
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Header */}
        {open && (
          <div className="text-center py-4 px-2">
            <h1 className="text-2xl font-bold">Department of CSE</h1>
          </div>
        )}

        {/* Collapse/Expand Button */}
        <button
          onClick={() => setOpen(!open)}
          className="absolute right-0 top-[45%] text-3xl hover:text-[#fee199] mt-5 mr-2"
        >
          {open ? (
            <TbLayoutSidebarLeftCollapseFilled />
          ) : (
            <TbLayoutSidebarRightCollapseFilled />
          )}
        </button>

        {/* Navigation */}
        <nav className="mt-10 px-2">
          <ul>
            <LinkItem to="/" icon={<TbHome />} label="Home" />

            <Section title="Scholars" icon={<TbUser />} id="scholar">
              <LinkItem to="/scholars" icon={<TbUser />} label="View Scholars" />
              {isFaculty && (
                <LinkItem
                  to="/scholar/add"
                  icon={<TbUserPlus />}
                  label="Add Scholar"
                />
              )}
            </Section>

            <Section title="Publications" icon={<TbBook />} id="publication">
              <LinkItem
                to="/publications"
                icon={<TbBook />}
                label="View Publications"
              />
              {isFaculty && (
                <LinkItem
                  to="/publication/add"
                  icon={<TbBookUpload />}
                  label="Add Publication"
                />
              )}
            </Section>

            <Section title="OD Requests" icon={<TbFilePlus />} id="od">
              {isFaculty && (
                <LinkItem
                  to="/OD/new"
                  icon={<TbFilePlus />}
                  label="New OD Request"
                />
              )}
              <LinkItem to="/OD" icon={<TbHistory />} label="OD History" />
            </Section>

            <LinkItem to="/CR/view" icon={<TbReport />} label="View CR" />

            {isAdmin && (
              <Section title="Admin Tools" icon={<TbUpload />} id="admin">
                <LinkItem
                  to="/admin/consolidation-report/menu"
                  icon={<TbReport />}
                  label="CR Consolidation"
                />
                <LinkItem
                  to="/admin/students"
                  icon={<TbUser />}
                  label="Manage Students"
                />
                <LinkItem
                  to="/admin/faculties"
                  icon={<TbUser />}
                  label="Manage Faculties"
                />
                <LinkItem
                  to="/admin/courses"
                  icon={<TbBook />}
                  label="Manage Courses"
                />
                <LinkItem
                  to="/admin/grievances"
                  icon={<TbFilePlus />}
                  label="Grievances"
                />
                <LinkItem
                  to="/admin/elective-courses"
                  icon={<TbBookUpload />}
                  label="Elective Courses"
                />
                <LinkItem
                  to="/admin/assigncourses"
                  icon={<TbUser />}
                  label="Assign Courses"
                />
                <LinkItem
                  to="/admin/assign-elective-faculties"
                  icon={<TbUserPlus />}
                  label="Assign Elective Faculties"
                />
                <LinkItem
                  to="/admin/elective-student-assignments"
                  icon={<TbBook />}
                  label="Elective Student Assignments"
                />
                <LinkItem
                  to="/admin/csvupload"
                  icon={<TbUpload />}
                  label="CSV Upload"
                />
              </Section>
            )}

            {user ? (
              <LinkItem
                to="/login"
                icon={<TbLogout2 />}
                label="Logout"
                onClick={logout}
              />
            ) : (
              <>
                <LinkItem to="/login" icon={<TbLogin2 />} label="Login" />
                <LinkItem to="/signup" icon={<TbUserPlus />} label="Signup" />
              </>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
}
