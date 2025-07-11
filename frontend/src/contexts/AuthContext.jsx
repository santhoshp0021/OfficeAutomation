import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (user && token) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
    // console.log(user)
  }, []);

  const login = async (credentials) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        credentials
      );
      const { user, token } = res.data;

      setCurrentUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      toast.success("Login successful");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
      return false;
    }
  };

  const signup = async (form) => {
    try {
      await axios.post("http://localhost:5000/api/auth/register", form);
      toast.success("Signup successful");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
  };

  const isAuthenticated = () => currentUser !== null;

  const hasRole = (role) => currentUser?.role === role;

  const hasAnyRole = (roles) => roles.includes(currentUser?.role);

  const getToken = () => localStorage.getItem("token");

  const value = {
    currentUser,
    login,
    logout,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    getToken,
    loading,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
