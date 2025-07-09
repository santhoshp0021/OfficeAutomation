import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

import { useNavigate } from "react-router-dom";
import "./HeaderBar.css";
import { FaNoteSticky, FaBars } from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import LogoutButton from "./LogoutButton";
import Notifications from "./Notifications/Notifications";

const slideDown = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const HeaderContainer = styled.header`
  background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);
  color: #fff;
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  animation: ${slideDown} 0.5s ease-out;
`;

const HeaderContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(motion.div)`
  font-size: 1.8rem;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;

  span {
    background: linear-gradient(45deg, #3498db, #2ecc71);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
  }
`;

const NavSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const IconButton = styled(motion.button)`
  background: none;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    color: #3498db;
  }

  &.active {
    color: #3498db;
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: 0;
  right: 0;
  background: #e74c3c;
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.4rem;
  border-radius: 50%;
  transform: translate(50%, -50%);
`;

const UserMenu = styled(motion.div)`
  position: relative;
`;

const UserAvatar = styled(motion.div)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3498db;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  color: white;
  border: 2px solid #fff;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    border-color: #3498db;
  }
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  min-width: 200px;
  margin-top: 0.5rem;
`;

const MenuItem = styled(motion.div)`
  padding: 0.8rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: #2c3e50;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover {
    background: #f7f9fc;
    color: #3498db;
  }

  svg {
    font-size: 1.1rem;
  }
`;

const FormButton = styled(motion.button)`
  background: none;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    color: #3498db;
    transform: rotate(30deg);
  }
`;

const HeaderBar = () => {
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        staggerChildren: 0.1,
      },
    },
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  const handleLogout = () => {
    // Add logout logic here
    logout();
    navigate("/login");
  };

  const handleScrollToSection = () => {
    navigate('/home');
    // Wait for navigation to complete before scrolling
    setTimeout(() => {
      const element = document.getElementById('your-voice-matter');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <HeaderContainer className="header-bar">
      <HeaderContent className="header-content">
        <Logo
          onClick={() => navigate("/home")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>Student</span> Care
        </Logo>
        <div className="nav-section-wrapper">
          <NavSection className={`nav-section${isMobileMenuOpen ? " open" : ""}`}>
            <FormButton
              onClick={handleScrollToSection}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaNoteSticky />
            </FormButton>
            {currentUser ? (
              <>
                {currentUser.role === "student" && <Notifications />}
                <LogoutButton />
              </>
            ) : (
              <button onClick={handleLoginClick} className="login-button">Login</button>
            )}
          </NavSection>
          <button
            className="hamburger"
            aria-label="Toggle menu"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            <FaBars size={24} />
          </button>
        </div>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default HeaderBar;
