import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Spinner from "./Spinner";

export default function ProtectedRoutes({ children }) {
  const { currentUser,loading } = useAuth();
  
  if(loading) return <Spinner/>
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
