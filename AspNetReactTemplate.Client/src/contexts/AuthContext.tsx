import { createContext } from "react";
import { User } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isExpert: boolean;
  isRestricted: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<boolean>;
  fetchUser: (options?: {
    signal?: AbortSignal;
    silent?: boolean;
  }) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
