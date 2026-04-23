import { useCallback, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  PhoneCall,
  ScrollText,
  SquareCheckBig,
  User,
  UserStar,
  Wrench,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import HeaderAccountSection from "@/components/layouts/header/HeaderAccountSection";
import HeaderManagementActions from "@/components/layouts/header/HeaderManagementActions";
import type { ManagementNavAction } from "@/components/layouts/header/types";
import { useExpertStandbyVisibility } from "@/components/layouts/header/useExpertStandbyVisibility";
import { useHeaderNotifications } from "@/components/layouts/header/useHeaderNotifications";
import { cn } from "@/lib/utils";

type HeaderProps = {
  onNavigateHome: () => void;
};

const navButtonClass =
  "h-10 px-3 focus-visible:ring-0 select-none flex items-center gap-2";

export default function Header({ onNavigateHome }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = location.pathname;

  const { user, isAdmin, isExpert, isAuthenticated, logout, fetchUser } =
    useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navigateTo = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate],
  );

  const {
    pendingExpertRequestCount,
    inboxItems,
    inboxUnreadCount,
    isInboxOpen,
    setIsInboxOpen,
    deleteAllInboxItems,
    deleteInboxItem,
    openInboxItem,
  } = useHeaderNotifications({
    isAuthenticated,
    isAdmin,
    onNavigateTo: navigateTo,
  });

  const { showExpertStandbyButton } = useExpertStandbyVisibility({
    isAuthenticated,
    isExpert,
    userId: user?.id,
  });

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const success = await logout();
      if (success) {
        onNavigateHome();
      }
    } catch (error) {
      console.error("Chyba pri odhlaseni v Headeru:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, onNavigateHome]);

  const initials =
    `${user?.firstName?.charAt(0) ?? ""}${user?.lastName?.charAt(0) ?? ""}`.toUpperCase() ||
    "U";

  const showExpertStandbyNav =
    isAuthenticated && isExpert && showExpertStandbyButton;

  // In other words, not normal user
  const showBorder = showExpertStandbyNav || isAdmin || isExpert;

  const managementActions = useMemo<ManagementNavAction[]>(() => {
    if (isAdmin) {
      return [
        {
          key: "tools",
          label: "Nástroje",
          icon: <Wrench className="h-4 w-4" />,
          to: "/admin/tools",
          isActive: activePath.startsWith("/admin/tools"),
        },
        {
          key: "expert-assignment",
          label: "Přiřazení expertů",
          icon: <UserStar className="h-4 w-4" />,
          to: "/admin/manual-help-management",
          isActive: activePath.startsWith("/admin/manual-help-management"),
        },
        {
          key: "users",
          label: "Uživatelé",
          icon: <User className="h-4 w-4" />,
          to: "/admin/users",
          isActive: activePath.startsWith("/admin/users"),
        },
        {
          key: "expert-role-requests",
          label: "Žádosti",
          icon: <ClipboardList className="h-4 w-4" />,
          to: "/admin/expert-role-requests",
          isActive: activePath.startsWith("/admin/expert-role-requests"),
          badgeCount: pendingExpertRequestCount,
        },
        {
          key: "paid-access",
          label: "Seznam plateb",
          icon: <ScrollText className="h-4 w-4" />,
          to: "/admin/paid-access",
          isActive: activePath.startsWith("/admin/paid-access"),
        },
      ];
    }

    if (isExpert) {
      return [
        ...(showExpertStandbyNav
          ? [
              {
                key: "expert-standby",
                label: "Čekání na hovory",
                icon: <PhoneCall className="h-4 w-4" />,
                to: "/expert-standby",
                isActive: activePath.startsWith("/expert-standby"),
              },
            ]
          : []),
        {
          key: "my-manuals",
          label: "Mé návody",
          icon: <SquareCheckBig className="h-4 w-4" />,
          to: "/manual-help-management",
          isActive: activePath.startsWith("/manual-help-management"),
        },
        {
          key: "expert-dashboard",
          label: "Přehled",
          icon: <BarChart3 className="h-4 w-4" />,
          to: "/expert-dashboard",
          isActive: activePath.startsWith("/expert-dashboard"),
        },
      ];
    }

    return [];
  }, [activePath, isAdmin, isExpert, pendingExpertRequestCount, showExpertStandbyNav]);

  return (
    <header className="border-b border-border/40 sticky top-0 z-50 bg-background/80 backdrop-blur-md p-4 md:px-8 2xl:px-14 transition-all shadow-sm">
      <div className="flex items-center justify-between mx-auto relative z-10">
        <Link
          to="/"
          onClick={onNavigateHome}
          className="transition-opacity hover:opacity-80"
        >
          <img style={{ height: "40px" }} src="/logo.svg" alt="Logo" />
        </Link>

        <div className="flex items-center gap-2 md:gap-4 text-sm font-medium">
          {isAuthenticated && (
            <div
              className={cn(
                showBorder &&
                  "border-r pr-2 md:pr-4 border-accent-foreground/10",
              )}
            >
              <Button
                asChild
                variant="ghost"
                className={cn(
                  navButtonClass,
                  activePath.startsWith("/search") &&
                    "bg-accent text-accent-foreground",
                )}
              >
                <Link to="/search">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden md:inline">Návody</span>
                </Link>
              </Button>
            </div>
          )}

          <HeaderManagementActions
            actions={managementActions}
            pendingExpertRequestCount={pendingExpertRequestCount}
            onNavigate={navigateTo}
            forceInline={isExpert}
          />

          <div className="flex items-center gap-2 border-l pl-2 md:pl-4 border-accent-foreground/10">
            <HeaderAccountSection
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              isExpert={isExpert}
              isLoggingOut={isLoggingOut}
              user={user ?? undefined}
              initials={initials}
              unreadCount={inboxUnreadCount}
              inboxItems={inboxItems}
              isInboxOpen={isInboxOpen}
              onInboxOpenChange={setIsInboxOpen}
              onOpenInboxItem={openInboxItem}
              onDeleteInboxItem={deleteInboxItem}
              onDeleteAllInboxItems={deleteAllInboxItems}
              onNavigateMyRequests={() => navigateTo("/my-requests")}
              onLogout={handleLogout}
              onLoginSuccess={async () => {
                await fetchUser();
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
