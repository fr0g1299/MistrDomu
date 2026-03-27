import { JSX, useCallback, useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Header from "./components/layouts/Header";
import Footer from "./components/layouts/Footer";
import { useDynamicScrollbar } from "./hooks/useDynamicScrollbar";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/Search";
import GuidePage from "./pages/Guide";
import ToolsManagement from "./pages/ToolsManagement";
import { useAuth } from "./hooks/useAuth";
import { AuthProvider } from "./components/providers/AuthProvider";

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { isAdmin, loading, isAuthenticated } = useAuth();

  if (loading) return null;
  if (!isAuthenticated || !isAdmin) return <Navigate to="/" replace />;

  return children;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

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
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/guide/:manualId" element={<GuidePage />} />

            <Route
              path="/tools-management"
              element={
                <AdminRoute>
                  <ToolsManagement />
                </AdminRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
