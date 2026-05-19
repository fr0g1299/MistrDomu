import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// TODO: Add a spinner component
const AuthLoader = () => {
  return <div>Loading...</div>;
};

export const AuthenticatedRoute = () => {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return <AuthLoader />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
};

export const AdminRoute = () => {
  const { isAdmin, loading, isAuthenticated } = useAuth();
  if (loading) return <AuthLoader />;
  if (!isAuthenticated || !isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
};

export const ManagementRoute = () => {
  const { isAdmin, isExpert, loading, isAuthenticated } = useAuth();
  if (loading) return <AuthLoader />;
  if (!isAuthenticated || (!isAdmin && !isExpert))
    return <Navigate to="/" replace />;
  return <Outlet />;
};

export const NonAdminAuthenticatedRoute = () => {
  const { loading, isAuthenticated, isAdmin, isExpert } = useAuth();
  if (loading) return <AuthLoader />;
  if (!isAuthenticated || isAdmin || isExpert)
    return <Navigate to="/" replace />;
  return <Outlet />;
};
