import { useCallback, useEffect } from "react";
import {
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
import { AuthProvider } from "./components/providers/AuthProvider";
import { Toaster } from "./components/ui/sonner";
import NotFound from "./pages/NotFound";

import {
  AuthenticatedRoute,
  AdminRoute,
  ManagementRoute,
  NonAdminAuthenticatedRoute,
} from "@/components/routing/AuthGuards";

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
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route
              path="/expert-onboarding"
              element={<ExpertOnboardingPage />}
            />

            {/* Authenticated routes (Users only) */}
            <Route element={<AuthenticatedRoute />}>
              <Route path="/search" element={<SearchPage />} />
              <Route path="/guide/:manualId" element={<GuidePage />} />
              <Route path="/my-requests" element={<MyRoleRequests />} />
            </Route>

            {/* Non-Admin routes */}
            <Route element={<NonAdminAuthenticatedRoute />}>
              <Route
                path="/my-requests/new"
                element={<MyRoleRequestCreate />}
              />
            </Route>

            {/* Management routes (Experts & Admins) */}
            <Route element={<ManagementRoute />}>
              <Route
                path="/manual-help-management"
                element={<ManualHelpManagement />}
              />
              <Route path="/expert-standby" element={<ExpertStandbyPage />} />
              <Route
                path="/expert-dashboard"
                element={<ExpertDashboardPage />}
              />
            </Route>

            {/* Admin routes */}
            <Route path="/admin" element={<AdminRoute />}>
              <Route path="tools" element={<AdminTools />} />
              <Route
                path="manual-help-management"
                element={<AdminExpertAssignment />}
              />
              <Route path="paid-access" element={<AdminPayments />} />
              <Route path="users" element={<AdminUsers />} />
              <Route
                path="expert-role-requests"
                element={<AdminExpertRoleRequests />}
              />
            </Route>

            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Background modal routes */}
          {backgroundLocation && (
            <Routes>
              <Route element={<NonAdminAuthenticatedRoute />}>
                <Route
                  path="/my-requests/new"
                  element={<MyRoleRequestCreate />}
                />
              </Route>
              <Route element={<AuthenticatedRoute />}>
                <Route
                  path="/my-requests/:requestId"
                  element={<MyRoleRequestDetail />}
                />
              </Route>
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
