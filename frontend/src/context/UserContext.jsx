import axios from "axios";
import toast from "react-hot-toast";
import { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext();

function UserProvider({ children }) {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [user, setUser] = useState(storedUser ? storedUser : null);
  // console.log(user);

  async function login(form) {
  try {
    const res = await axios.post("http://localhost:5000/api/auth/login", form);
    const user = res.data.user;
    if (user.role === "faculty") {
      const facultyRes = await axios.get(`http://localhost:5000/api/faculty/${user.userId}`);
      const faculty = facultyRes.data;

      user.facultyId = faculty.facultyId || faculty._id;
      user.facultyProfile = faculty;
    }
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
    toast.success("Login successful");
    return true;
  } catch (err) {
    toast.error(err.response?.data?.message || "Login failed");
    return false;
  }
}


  async function signup(form) {
    try {
      await axios.post("http://localhost:5000/api/auth/register", form);
      toast.success("Signup successful");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
      return false;
    }
  }
  async function logout() {
    try {
      localStorage.removeItem("user");
      setUser();
      toast.success("logged out successfully");
    } catch (err) {
      console.log(err);
    }
  }
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("user"));
    // console.log("data:", data);
    if (data != null) {
      setUser(data);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, login, signup, logout }}>
      {children}
    </UserContext.Provider>
  );
}

function UserData() {
  const context = useContext(UserContext);
  if (!context) throw new Error("Context not accesible outside boundary");
  return context;
}
export { UserData, UserProvider };
