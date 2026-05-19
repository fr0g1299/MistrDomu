import { useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { User, Role } from "@/types/auth";
import { AuthContext } from "@/contexts/AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(
    async (options?: { signal?: AbortSignal; silent?: boolean }) => {
      const { signal, silent = false } = options || {};

      try {
        if (!silent) setLoading(true);

        const res = await fetch("/api/Auth/me", {
          credentials: "include",
          signal,
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
          return true;
        } else {
          setUser(null);
          return false;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return false; // Fetch aborted gracefully
        }
        console.error("Chyba při načítání uživatele:", error);
        setUser(null);
        return false;
      } finally {
        if (!signal?.aborted && !silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  // Initial mount fetch
  useEffect(() => {
    const controller = new AbortController();
    void fetchUser({ signal: controller.signal });
    return () => controller.abort();
  }, [fetchUser]);

  // Listen for auth changes across tabs/events
  useEffect(() => {
    const handleAuthChanged = () => {
      // Run silently to prevent UI flickering
      void fetchUser({ silent: true });
    };

    window.addEventListener("auth:changed", handleAuthChanged);
    return () => window.removeEventListener("auth:changed", handleAuthChanged);
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      const response = await fetch("/api/Auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setUser(null);
        return true;
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
    return false;
  }, []);

  const value = useMemo(() => {
    const isAdmin = user?.roles?.includes(Role.Admin) ?? false;
    const isExpert = user?.roles?.includes(Role.Expert) ?? false;
    const isRestricted = user?.roles?.includes(Role.RestrictedUser) ?? false;
    const isAuthenticated = user?.isAuthenticated ?? false;

    return {
      user,
      loading,
      isAdmin,
      isExpert,
      isRestricted,
      isAuthenticated,
      logout,
      fetchUser,
    };
  }, [user, loading, logout, fetchUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
