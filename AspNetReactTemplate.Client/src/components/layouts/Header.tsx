import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

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
import { BookOpen, LogOut, Loader2, Settings } from "lucide-react";

type HeaderProps = {
  onNavigateHome: () => void;
};

export default function Header({ onNavigateHome }: HeaderProps) {
  const navigate = useNavigate();
  
  const { user, isAdmin, isExpert, isAuthenticated, logout, fetchUser } = useAuth();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const success = await logout();
      if (success) {
        onNavigateHome();
      }
    } catch (error) {
      console.error("Chyba při odhlášení v Headeru:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, onNavigateHome]);

  const initials = `${user?.firstName?.charAt(0) ?? ""}${user?.lastName?.charAt(0) ?? ""}`
    .toUpperCase() || "U";

  return (
    <header className="border-b border-border/40 sticky top-0 z-50 bg-background/80 backdrop-blur-md p-4 md:px-14 transition-all shadow-sm">
      <div className="flex items-center justify-between mx-auto relative z-10">
        
        {/* Logo - používáme Link pro bleskovou navigaci bez F5 */}
        <Link 
          to="/" 
          onClick={onNavigateHome} 
          className="transition-opacity hover:opacity-80"
        >
          <img style={{ height: "40px" }} src="/logo.svg" alt="Logo" />
        </Link>

        <div className="flex items-center gap-2 md:gap-4 text-sm font-medium">

          <Button
            asChild
            variant="ghost"
            className="h-10 px-3 focus-visible:ring-0 select-none flex items-center gap-2"
          >
            <Link to="/search">
              <BookOpen className="h-4 w-4" />
              <span className="hidden md:inline">Návody</span>
            </Link>
          </Button>
          
          {/* SEKCE SPRÁVA - pro Admina i budoucího Experta */}
          {(isAdmin || isExpert) && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 px-3 focus-visible:ring-0 select-none flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline">Správa</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={10}>
                <DropdownMenuSeparator />
                {isAdmin ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => navigate("/tools-management")}
                      className="cursor-pointer"
                    >
                      Nástroje
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/admin/manual-help-management")}
                      className="cursor-pointer"
                    >
                      Pomoc s návody (admin)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/manual-help-management")}
                      className="cursor-pointer"
                    >
                      Spravovat mé návody
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onClick={() => navigate("/manual-help-management")}
                    className="cursor-pointer"
                  >
                    Spravovat mé návody
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="flex items-center gap-2 border-l pl-2 md:pl-4 border-accent-foreground/10">
            {isAuthenticated ? (
              /* PŘIHLÁŠENÝ UŽIVATEL */
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 rounded-full px-2 md:px-3 focus-visible:ring-0 select-none flex items-center gap-2"
                    disabled={isLoggingOut}
                  >
                    <span className="hidden md:inline text-sm font-medium text-foreground max-w-60 overflow-hidden text-ellipsis whitespace-nowrap">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <Avatar className="h-10 w-10 border border-accent/20">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56" align="end" sideOffset={10}>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Můj účet</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-500 focus:bg-red-50 dark:focus:bg-red-950 focus:text-red-500 cursor-pointer"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    <span>{isLoggingOut ? "Odhlašování..." : "Odhlásit se"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* NEPŘIHLÁŠENÝ UŽIVATEL */
              <div className="inline-flex">
                <AuthDialog onLoginSuccess={fetchUser} />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}