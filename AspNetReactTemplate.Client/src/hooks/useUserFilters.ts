import { useEffect, useState } from "react";

interface UserFilters {
  search: string;
  role: string;
  sortDirection: "asc" | "desc";
  sortBy: "lastName" | "role";
  page: number;
}

const COOKIE_NAME = "userListFilters";
const COOKIE_MAX_AGE = 31536000;

/**
 * Hook pro správu filtrů uživatelů z cookies
 * Automaticky načítá a ukládá filtry do cookies
 */
export function useUserFilters() {
  const [filters, setFilters] = useState<UserFilters>(() => {
    // Načti inicializní hodnoty z cookies
    if (typeof window === "undefined") {
      return {
        search: "",
        role: "",
        sortDirection: "asc",
        sortBy: "lastName",
        page: 1,
      };
    }

    const cookieValue = getCookie(COOKIE_NAME);
    if (cookieValue) {
      try {
        return JSON.parse(decodeURIComponent(cookieValue));
      } catch {
        return {
          search: "",
          role: "",
          sortDirection: "asc",
          sortBy: "lastName",
          page: 1,
        };
      }
    }

    return {
      search: "",
      role: "",
      sortDirection: "asc",
      sortBy: "lastName",
      page: 1,
    };
  });

  // Uklidej filtry do cookies když se změní
  useEffect(() => {
    setCookie(COOKIE_NAME, JSON.stringify(filters), COOKIE_MAX_AGE);
  }, [filters]);

  const updateFilters = (partial: Partial<UserFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      role: "",
      sortDirection: "asc",
      sortBy: "lastName",
      page: 1,
    });
    deleteCookie(COOKIE_NAME);
  };

  return {
    filters,
    updateFilters,
    resetFilters,
    setSearch: (search: string) => updateFilters({ search }),
    setRole: (role: string) => updateFilters({ role }),
    setSortDirection: (sortDirection: "asc" | "desc") =>
      updateFilters({ sortDirection }),
    setSortBy: (sortBy: "lastName" | "role") =>
      updateFilters({ sortBy }),
    setPage: (page: number) => updateFilters({ page }),
  };
}

/**
 * Pomocná funkce pro čtení cookie
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() ?? null;
  }
  return null;
}

/**
 * Pomocná funkce pro zápis cookie
 */
function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;

  const encodedValue = encodeURIComponent(value);
  document.cookie = `${name}=${encodedValue};path=/;max-age=${maxAge};SameSite=Strict`;
}

/**
 * Pomocná funkce pro smazání cookie
 */
function deleteCookie(name: string) {
  setCookie(name, "", 0);
}

