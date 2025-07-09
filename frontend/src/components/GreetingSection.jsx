import React from "react";
import StatsCard from "./StatsCard";
import "./GreetingSection.css";
import { FaList, FaCheck, FaUserCheck, FaGraduationCap, FaCalendar, FaUsers, FaClipboardCheck } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

const GreetingSection = () => {
  const { currentUser } = useAuth();
  
  // Default stats for all users
  const defaultStats = [
    {
      icon: <FaList />,
      label: "Total Grievances:",
      value: 56,
    },
    {
      icon: <FaCheck />,
      label: "Grievances Resolved:",
      value: 24,
    },
    {
      icon: <FaUserCheck />,
      label: "Grievances Resolved:",
      value: 47,
    },
  ];

  // Student-specific stats
  const studentStats = [
    {
      icon: <FaGraduationCap />,
      label: "Current Semester:",
      value: currentUser?.current_semester || "N/A",
    },
    {
      icon: <FaUsers />,
      label: "Batch:",
      value: currentUser?.batch || "N/A",
    },
    {
      icon: <FaCalendar />,
      label: "Joined Year:",
      value: currentUser?.joined_year || "N/A",
    },
    {
      icon: <FaClipboardCheck />,
      label: "Feedback Status:",
      value: currentUser?.isFeedbackGiven ? "Completed" : "Pending",
    },
  ];

  // Choose stats based on user role
  const stats = currentUser?.role === "student" ? studentStats : defaultStats;

  const greeting = `Hello ${currentUser?.name},`;

  const hoverEffect = {
    initial: { scale: 1 },
    whileHover: { scale: 1.05 },
  };

  return (
    <section className="greeting-section">
      <div className="greeting-bg" />
      <div className="greeting-content">
        <div className="head-typo">
          <h1>
            <AnimatePresence>
              {greeting.split("").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {char}
                </motion.span>
              ))}
            </AnimatePresence>
          </h1>
          <p>
            {currentUser?.role === "student" 
              ? `Welcome to Semester ${currentUser?.current_semester}, Batch ${currentUser?.batch}`
              : "Manage Your Grievances with ease"
            }
          </p>
        </div>
        <div className="stats-row">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.4 }}
            >
              <StatsCard {...stat} hoverEffect={hoverEffect} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GreetingSection;
