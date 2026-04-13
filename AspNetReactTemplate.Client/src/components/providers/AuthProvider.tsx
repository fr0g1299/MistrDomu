import { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { User, Role } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isExpert: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<boolean>;
  fetchUser: () => Promise<boolean>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/Auth/me", { credentials: "include" });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return true;
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Chyba při načítání uživatele:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
    return false;
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const handleAuthChanged = () => {
      void fetchUser();
    };

    window.addEventListener("auth-changed", handleAuthChanged);
    return () => window.removeEventListener("auth-changed", handleAuthChanged);
  }, [fetchUser]);

  const isAdmin = user?.roles?.includes(Role.Admin) ?? false;
  const isExpert = user?.roles?.includes(Role.Expert) ?? false;
  const isAuthenticated = !!user && user.isAuthenticated;

  const logout = async () => {
  try {
    const response = await fetch("/api/Auth/logout", { 
        method: "POST", 
        credentials: "include" 
    });
    if (response.ok) {
      setUser(null);
      return true;
    }
  } catch (error) {
    console.error("Logout failed", error);
  }
  return false;
};

  const value = {
    user,
    loading,
    isAdmin,
    isExpert,
    isAuthenticated,
    setUser,
    logout,
    fetchUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};