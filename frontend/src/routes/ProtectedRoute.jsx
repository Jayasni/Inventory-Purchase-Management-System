
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (
    roles &&
    user?.role &&
    !roles.includes(user.role)
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}
