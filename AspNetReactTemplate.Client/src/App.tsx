import { useCallback } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import Header from "./components/layouts/Header";
import Footer from "./components/layouts/Footer";
import { useDynamicScrollbar } from "./hooks/useDynamicScrollbar";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/Search";

function App() {
  const navigate = useNavigate();

  const navigateHome = useCallback(() => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [navigate]);

  useDynamicScrollbar();

  return (
    <div className="min-h-screen flex flex-col antialiased selection:text-primary selection:bg-primary/10 dark:selection:bg-primary/5">
      <Header onNavigateHome={navigateHome} />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
