import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoutes({ children }) {
  const { currentUser: user } = useAuth();
  // console.log(user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
