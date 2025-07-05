import { Navigate } from "react-router-dom";
import { UserData } from "../context/UserContext";

export default function ProtectedRoutes({ children }) {
  const { user } = UserData();
    // console.log(user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
