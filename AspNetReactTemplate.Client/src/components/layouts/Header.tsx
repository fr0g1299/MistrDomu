import { useState, useEffect, useCallback } from "react";

// Shadcn UI Imports
import { Button } from "@/components/ui/button";
import { AuthDialog } from "../identity/AuthDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Loader2 } from "lucide-react";
import { User } from "@/types/user";

type HeaderProps = {
  onNavigateHome: () => void;
};

export default function Header({ onNavigateHome }: HeaderProps) {
  // Stav pro uživatele
  const [user, setUser] = useState<User | null>(null);

  // Stav pro proces odhlašování
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });

      if (response.ok) {
        const data = await response.json();

        setUser(data);
      } else {
        setUser({ isAuthenticated: false });
      }
    } catch {
      setUser({ isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const onAuthChanged = () => {
      refreshUser();
    };

    window.addEventListener("auth-changed", onAuthChanged);
    return () => {
      window.removeEventListener("auth-changed", onAuthChanged);
    };
  }, [refreshUser]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setUser({ isAuthenticated: false });

        onNavigateHome();
      } else {
        console.error("Server odmítl odhlášení");

        alert("Odhlášení se nezdařilo. Zkuste to prosím znovu.");
      }
    } catch (error) {
      console.error("Chyba při komunikaci se serverem:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [onNavigateHome]);

  const initials = `${user?.firstName?.trim().charAt(0) ?? ""}${user?.lastName?.trim().charAt(0) ?? ""}`
    .toUpperCase() || "U";

  return (
    <header className="border-b border-border/40 sticky top-0 z-50 bg-background/80 backdrop-blur-md p-4 md:px-14 transition-all shadow-sm">
      {/* <header className="border-accent-foreground/10 dark:border-accent/10 sticky top-0 z-50 bg-background/60 dark:bg-background/40 p-6 shadow-xl backdrop-blur-sm md:flex-row md:items-center md:px-14"> */}
      <div className="flex items-center justify-between mx-auto relative z-10">
        {/* Logo */}
        {/* TODO: Turn into Link */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigateHome();
          }}
          className="transition-opacity"
        >
          <img style={{ height: "40px" }} src="/logo.svg" alt="Logo" />
        </a>

        <div className="flex items-center gap-2 md:gap-4 text-sm font-medium">
          <div className="flex items-center gap-2 border-l pl-2 md:pl-4 border-accent-foreground/10">
            {user?.isAuthenticated ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 rounded-full px-2 md:px-3 focus-visible:ring-0 select-none flex items-center gap-2"
                    disabled={isLoggingOut} // Zablokuje avatar při odhlašování
                  >
                    <span className="hidden md:inline text-sm font-medium text-foreground max-w-60 overflow-hidden text-ellipsis whitespace-nowrap">
                      {user.firstName + " " + user.lastName || "Uživatel"}
                    </span>
                    <Avatar className="h-10 w-10 border border-accent/20">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-56"
                  align="end"
                  sideOffset={10}
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Můj účet
                      </p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user.firstName + " " + user.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="text-red-500 focus:bg-red-50 dark:focus:bg-red-950 focus:text-red-500 cursor-pointer"
                    onClick={handleLogout}
                    disabled={isLoggingOut} // Zablokuje položku menu
                  >
                    {isLoggingOut ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}

                    <span>
                      {isLoggingOut ? "Odhlašování..." : "Odhlásit se"}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="inline-flex">
                <AuthDialog onLoginSuccess={refreshUser} />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
