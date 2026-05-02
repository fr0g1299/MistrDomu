import { useContext } from "react";
import { Role } from "@/types/auth";
import { AuthContext } from "@/components/providers/AuthProvider";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth musí být použit uvnitř AuthProvideru");
  }

  const {
    user,
    loading,
    logout,
    isAdmin,
    isExpert,
    isRestricted,
    isAuthenticated,
    fetchUser,
  } = context;

  const hasRole = (role: Role) => {
    return user?.roles?.includes(role) ?? false;
  };

  return {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isExpert,
    isRestricted,
    hasRole,
    logout,
    fetchUser,
  };
};
