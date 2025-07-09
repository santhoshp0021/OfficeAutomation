import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
// const faculty = {
//   facultyId: "FAC002",
//   name: "faculty",
//   position: "Assistant Professor",
//   contactInfo: {
//     email: "faculty@example.com",
//     phone: "+919876543210",
//   },
//   areasOfExpertise: ["Machine Learning", "AI", "Data Science"],
//   classesHandled: [
//     {
//       semester: "3",
//       _id: "6845c010f4d7457e793dfd3e",
//     },
//     {
//       semester: "5",
//       _id: "6845c010f4d7457e793dfd3f",
//     },
//   ],
//   dob: "1985-04-20T00:00:00.000Z",
//   dateOfJoining: "2015-08-12T00:00:00.000Z",
//   isActive: true,
//   _id: "6845c010f4d7457e793dfd3d",
//   __v: 0,
// };

// const hod = {
//   facultyId: "FAC003",
//   name: "hod",
//   position: "Head of Department",
//   contactInfo: {
//     email: "hod@example.com",
//     phone: "+919112233445",
//   },
//   areasOfExpertise: ["Database Systems", "Software Engineering"],
//   classesHandled: [
//     {
//       semester: "4",
//       _id: "6845c02cf4d7457e793dfd42",
//     },
//     {
//       semester: "7",
//       _id: "6845c02cf4d7457e793dfd43",
//     },
//   ],
//   dob: "1978-09-10T00:00:00.000Z",
//   dateOfJoining: "2008-01-05T00:00:00.000Z",
//   isActive: true,
//   _id: "6845c02cf4d7457e793dfd41",
//   __v: 0,
// };
// const admin = {
//   facultyId: "FAC001",
//   name: "admin",
//   position: "Admin",
//   contactInfo: {
//     email: "admin@example.com",
//     phone: "+911234567890",
//   },
//   areasOfExpertise: ["System Administration", "Security", "Networking"],
//   classesHandled: [
//     {
//       semester: "5",
//       _id: "6845bcc003d9421f7b3a4cd1",
//     },
//     {
//       semester: "6",
//       _id: "6845bcc003d9421f7b3a4cd2",
//     },
//   ],
//   dob: "1980-01-15T00:00:00.000Z",
//   dateOfJoining: "2010-06-01T00:00:00.000Z",
//   isActive: true,
//   _id: "6845bcc003d9421f7b3a4cd0",
//   __v: 0,
// };

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
