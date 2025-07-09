import React from "react";
import { FaArrowRight, FaBell } from "react-icons/fa";
import "./navbar.css";
import { useAuth } from "../../contexts/AuthContext";

const NavBar = ({ onHamburgerClick }) => {
  const { logout } = useAuth();
  return (
    <div className="navbar">
      <div className="navbar__left">
        <button className="navbar__hamburger" onClick={onHamburgerClick}>
          <span />
          <span />
          <span />
        </button>
        <span className="navbar__title">Admin Panel</span>
      </div>
      <div onClick={() => logout()} className="navbar__right">
        <span className="navbar__icon" style={{fontWeight: 600}}  >Logout</span>
        <FaArrowRight  className="navbar__icon" />
      </div>
    </div>
  );
};

export default NavBar;
