import React, { useState } from "react";
import "./loginpage.css";
import Lottie from "lottie-react";
import phoneHand from "../../../assests/animations/getting-started-logo-animation.json";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    id: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const [passwordHint, setPasswordHint] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
  };

  const getPasswordHint = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/auth/password-hint/${formData.id}/${formData.role}`
      );
      if (response.ok) {
        const data = await response.json();
        setPasswordHint(data.hint);
        setShowPasswordHint(true);
      } else {
        setError("Could not get password hint");
      }
    } catch (err) {
      setError("Error getting password hint");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Login successful!");
        // Use AuthContext login function
        login(data.user, data.token);
        // Redirect based on role
        setTimeout(() => {
          if (data.user.role === "student") {
            navigate("/home");
          } else if (data.user.role === "faculty") {
            navigate("/faculty/performance");
          } else if (data.user.role === "admin") {
            navigate("/admin/dashboard");
          }
        }, 1000);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="login-container">
      {/* Page Heading and Role Descriptions */}

      {/* <div className="login-role-descriptions">
        <div className="login-role-card student-role">
          <h3>Students</h3>
          <p>Submit feedback and grievances, and track responses.</p>
        </div>
        <div className="login-role-card faculty-role">
          <h3>Faculty</h3>
          <p>View feedback, respond to grievances, and download reports.</p>
        </div>
        <div className="login-role-card admin-role">
          <h3>Admins</h3>
          <p>Manage users, courses, feedback, and grievances.</p>
        </div>
      </div> */}
      <div className="login-left">
        <motion.div
          initial={{
            width: "105%",
            height: "120%",
            transform: "rotate(-30deg)",
            left: "-20%",
          }}
          animate={{
            transform: "rotate(0deg)",
            left: "0%",
            top: "0%",
          }}
          transition={{
            delay: 0.5,
            duration: 1,
            ease: "easeInOut",
          }}
          className="login-shape"
        ></motion.div>
        <div className="login-image-circle">
          <Lottie animationData={phoneHand} loop={true} />
        </div>
      </div>
      <motion.div
        initial={{
          opacity: 0,
          x: 100,
        }}
        animate={{
          opacity: 1,
          x: 10,
        }}
        transition={{
          delay: 1.5,
          duration: 1,
          ease: "easeInOut",
        }}
        className="login-right"
      >
        <div className="login-page-header-short">
          <h2 className="login-title-short">
            Welcome to the Grievance & Feedback Portal
          </h2>
          <div className="login-subtitle-short">Login to continue</div>
        </div>
        <h2 className="login-welcome">
          Hey,
          <br />
          Welcome Back
        </h2>
        <div
          style={{
            marginBottom: 18,
          }}
        >
          <select
            className="login-input"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <input
          className="login-input"
          type="text"
          placeholder="Enter your registered number"
          name="id"
          value={formData.id}
          onChange={handleChange}
          required
        />
        <input
          className="login-input"
          type="password"
          placeholder="Enter your password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="button" onClick={getPasswordHint} className="hint-btn">
          Get Password Hint
        </button>
        {showPasswordHint && (
          <div className="password-hint">
            <p>
              <strong>Password Hint:</strong> {passwordHint}
            </p>
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <button className="login-button" onClick={handleSubmit}>
          Log In
        </button>
      </motion.div>
    </div>
  );
};

export default LoginPage;
