import { JSX, useCallback, useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
  type Location,
} from "react-router-dom";

import Header from "./components/layouts/Header";
import Footer from "./components/layouts/Footer";
import { useDynamicScrollbar } from "./hooks/useDynamicScrollbar";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/Search";
import GuidePage from "./pages/Guide";
import AdminTools from "./pages/admin/Tools";
import ManualHelpManagement from "./pages/ManualHelpManagement";
import AdminExpertAssignment from "./pages/admin/ExpertAssignment";
import AdminPayments from "./pages/admin/Payments";
import AdminUsers from "./pages/admin/Users";
import AdminExpertRoleRequests from "./pages/admin/Requests";
import MyRoleRequests from "./pages/MyRoleRequests";
import MyRoleRequestCreate from "./pages/MyRoleRequestCreate";
import MyRoleRequestDetail from "./pages/MyRoleRequestDetail";
import ExpertOnboardingPage from "./pages/ExpertOnboardingPage";
import ExpertStandbyPage from "./pages/ExpertStandbyPage";
import ExpertDashboardPage from "./pages/ExpertDashboardPage";
import { useAuth } from "./hooks/useAuth";
import { AuthProvider } from "./components/providers/AuthProvider";
import { Toaster } from "./components/ui/sonner";
import NotFound from "./pages/NotFound";

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { isAdmin, loading, isAuthenticated } = useAuth();

  if (loading) return null;
  if (!isAuthenticated || !isAdmin) return <Navigate to="/" replace />;

  return children;
};

const ManagementRoute = ({ children }: { children: JSX.Element }) => {
  const { isAdmin, isExpert, loading, isAuthenticated } = useAuth();

  if (loading) return null;
  if (!isAuthenticated || (!isAdmin && !isExpert))
    return <Navigate to="/" replace />;

  return children;
};

const AuthenticatedRoute = ({ children }: { children: JSX.Element }) => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return children;
};

const NonAdminAuthenticatedRoute = ({
  children,
}: {
  children: JSX.Element;
}) => {
  const { loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) return null;
  if (!isAuthenticated || isAdmin) return <Navigate to="/" replace />;

  return children;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location } | null;
  const backgroundLocation = state?.backgroundLocation;

  const navigateHome = useCallback(() => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [navigate]);

  useDynamicScrollbar();

  // Prevent browser from restoring scroll position automatically
  // ! Remove if things break
  useEffect(() => {
    try {
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
      }
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col antialiased selection:text-primary selection:bg-primary/10 dark:selection:bg-primary/5">
        <Header onNavigateHome={navigateHome} />

        <main className="flex-1">
          <Routes location={backgroundLocation || location}>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/expert-onboarding"
              element={<ExpertOnboardingPage />}
            />

            {/* Authenticated Routes */}
            <Route path="/search" element={<SearchPage />} />
            <Route path="/guide/:manualId" element={<GuidePage />} />
            <Route
              path="/my-requests"
              element={
                <AuthenticatedRoute>
                  <MyRoleRequests />
                </AuthenticatedRoute>
              }
            />

            {/* Expert Routes */}
            <Route
              path="/manual-help-management"
              element={
                <ManagementRoute>
                  <ManualHelpManagement />
                </ManagementRoute>
              }
            />
            <Route
              path="/expert-standby"
              element={
                <ManagementRoute>
                  <ExpertStandbyPage />
                </ManagementRoute>
              }
            />
            <Route
              path="/expert-dashboard"
              element={
                <ManagementRoute>
                  <ExpertDashboardPage />
                </ManagementRoute>
              }
            />
            <Route
              path="/my-requests/new"
              element={
                <NonAdminAuthenticatedRoute>
                  <MyRoleRequestCreate />
                </NonAdminAuthenticatedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/tools"
              element={
                <AdminRoute>
                  <AdminTools />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/manual-help-management"
              element={
                <AdminRoute>
                  <AdminExpertAssignment />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/paid-access"
              element={
                <AdminRoute>
                  <AdminPayments />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/expert-role-requests"
              element={
                <AdminRoute>
                  <AdminExpertRoleRequests />
                </AdminRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>

          {backgroundLocation && (
            <Routes>
              <Route
                path="/my-requests/new"
                element={
                  <NonAdminAuthenticatedRoute>
                    <MyRoleRequestCreate />
                  </NonAdminAuthenticatedRoute>
                }
              />

              <Route
                path="/my-requests/:requestId"
                element={
                  <AuthenticatedRoute>
                    <MyRoleRequestDetail />
                  </AuthenticatedRoute>
                }
              />
            </Routes>
          )}
        </main>

        <Toaster position="bottom-right" />

        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
