import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/lib/apiService";
import type { NotificationListItem } from "@/types/notification";

// Shadcn UI Imports
import { Button } from "@/components/ui/button";
import { AuthDialog } from "../identity/AuthDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Bell,
  BookOpen,
  LogOut,
  Loader2,
  PhoneCall,
  Settings,
  X,
} from "lucide-react";

type HeaderProps = {
  onNavigateHome: () => void;
};

const INBOX_PAGE_SIZE = 5;

export default function Header({ onNavigateHome }: HeaderProps) {
  const navigate = useNavigate();

  const { user, isAdmin, isExpert, isAuthenticated, logout, fetchUser } =
    useAuth();
  const [pendingExpertRequestCount, setPendingExpertRequestCount] = useState(0);
  const [inboxItems, setInboxItems] = useState<NotificationListItem[]>([]);
  const [inboxUnreadCount, setInboxUnreadCount] = useState(0);
  const [inboxCurrentPage, setInboxCurrentPage] = useState(1);
  const [inboxTotalPages, setInboxTotalPages] = useState(0);
  const [isLoadingMoreInbox, setIsLoadingMoreInbox] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showExpertStandbyButton, setShowExpertStandbyButton] = useState(false);

  useEffect(() => {
    const userId = user?.id;
    if (!isAuthenticated || !isExpert || !userId) {
      setShowExpertStandbyButton(false);
      return;
    }

    let cancelled = false;

    const loadExpertManualAssignments = async () => {
      try {
        const manuals = await apiService.getManualsForExpert(userId);
        if (!cancelled) {
          setShowExpertStandbyButton(manuals.length > 0);
        }
      } catch {
        if (!cancelled) {
          setShowExpertStandbyButton(false);
        }
      }
    };

    void loadExpertManualAssignments();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isExpert, user?.id]);

  const unreadCount = inboxUnreadCount;
  const hasMoreInboxItems = inboxCurrentPage < inboxTotalPages;

  const refreshHeaderNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setInboxItems([]);
      setInboxUnreadCount(0);
      setInboxCurrentPage(1);
      setInboxTotalPages(0);
      setIsLoadingMoreInbox(false);
      setPendingExpertRequestCount(0);
      return;
    }

    try {
      const notifications = await apiService.getMyNotifications({
        page: 1,
        pageSize: INBOX_PAGE_SIZE,
      });
      setInboxItems(notifications.items);
      setInboxUnreadCount(notifications.unreadCount);
      setInboxCurrentPage(notifications.currentPage);
      setInboxTotalPages(notifications.totalPages);
      setIsLoadingMoreInbox(false);
    } catch {
      // Do not break header rendering when notifications fail.
    }

    if (isAdmin) {
      try {
        const count = await apiService.getPendingExpertRoleRequestsCount();
        setPendingExpertRequestCount(count);
      } catch {
        setPendingExpertRequestCount(0);
      }
    } else {
      setPendingExpertRequestCount(0);
    }
  }, [isAdmin, isAuthenticated]);

  const loadMoreInboxItems = useCallback(async () => {
    if (!isAuthenticated || isLoadingMoreInbox || !hasMoreInboxItems) {
      return;
    }

    setIsLoadingMoreInbox(true);
    try {
      const nextPage = inboxCurrentPage + 1;
      const notifications = await apiService.getMyNotifications({
        page: nextPage,
        pageSize: INBOX_PAGE_SIZE,
      });

      setInboxItems((current) => {
        const knownIds = new Set(current.map((item) => item.id));
        const newItems = notifications.items.filter(
          (item) => !knownIds.has(item.id),
        );
        return [...current, ...newItems];
      });
      setInboxUnreadCount(notifications.unreadCount);
      setInboxCurrentPage(notifications.currentPage);
      setInboxTotalPages(notifications.totalPages);
    } catch {
      toast.error("Načítání dalších notifikací se nezdařilo.");
    } finally {
      setIsLoadingMoreInbox(false);
    }
  }, [
    hasMoreInboxItems,
    inboxCurrentPage,
    isAuthenticated,
    isLoadingMoreInbox,
  ]);

  const deleteAllInboxItems = useCallback(() => {
    if (inboxItems.length === 0) {
      return;
    }

    const previousItems = inboxItems;
    const previousUnreadCount = inboxUnreadCount;

    setInboxItems([]);
    setInboxUnreadCount(0);
    setInboxCurrentPage(1);
    setInboxTotalPages(0);

    void apiService.deleteAllNotifications().catch((error) => {
      setInboxItems(previousItems);
      setInboxUnreadCount(previousUnreadCount);
      toast.error(
        error instanceof Error
          ? error.message
          : "Smazání všech notifikací se nezdařilo.",
      );
      void refreshHeaderNotifications();
    });
  }, [inboxItems, inboxUnreadCount, refreshHeaderNotifications]);

  const deleteInboxItem = useCallback(
    (id: number) => {
      const previousItems = inboxItems;
      const previousUnreadCount = inboxUnreadCount;
      const target = previousItems.find((item) => item.id === id);

      if (!target) {
        return;
      }

      setInboxItems((current) => current.filter((item) => item.id !== id));
      if (!target.isRead) {
        setInboxUnreadCount((prev) => Math.max(0, prev - 1));
      }

      void apiService
        .deleteNotification(id)
        .then(() => {
          // Re-sync unread counter and first-page items with backend truth.
          void refreshHeaderNotifications();
        })
        .catch((error) => {
          setInboxItems(previousItems);
          setInboxUnreadCount(previousUnreadCount);
          toast.error(
            error instanceof Error
              ? error.message
              : "Smazání zprávy se nezdařilo.",
          );
        });
    },
    [inboxItems, inboxUnreadCount, refreshHeaderNotifications],
  );

  useEffect(() => {
    void refreshHeaderNotifications();
  }, [refreshHeaderNotifications]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshHeaderNotifications();
    }, 20000);

    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, refreshHeaderNotifications]);

  const getInboxTypeLabel = (type?: string) => {
    if (type === "role_request_admin") return "Admin";
    if (type === "role_request") return "Žádost";
    return "Info";
  };

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
          {isAuthenticated && (
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
          )}

          {isAuthenticated && isExpert && showExpertStandbyButton && (
            <Button
              asChild
              variant="ghost"
              className="h-10 px-3 focus-visible:ring-0 select-none flex items-center gap-2"
            >
              <Link to="/expert-standby">
                <PhoneCall className="h-4 w-4" />
                <span className="hidden md:inline">Čekání na hovory</span>
              </Link>
            </Button>
          )}

          {/* SEKCE SPRÁVA - pro Admina i budoucího Experta */}
          {(isAdmin || isExpert) && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 px-3 focus-visible:ring-0 select-none flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline">Správa</span>
                  {isAdmin && pendingExpertRequestCount > 0 && (
                    <Badge className="ml-1 h-5 min-w-5 justify-center px-1 py-0 text-[10px] leading-none">
                      {pendingExpertRequestCount}
                    </Badge>
                  )}
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
                      Správa přiřazení expertů
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer">
                        Uživatelé
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={() => navigate("/admin/users")}
                          className="cursor-pointer"
                        >
                          Správa uživatelů
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            navigate("/admin/expert-role-requests")
                          }
                          className="cursor-pointer"
                        >
                          Žádosti o roli Expert
                          {pendingExpertRequestCount > 0 && (
                            <Badge className="ml-2 h-5 min-w-5 justify-center px-1 py-0 text-[10px] leading-none">
                              {pendingExpertRequestCount}
                            </Badge>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem
                      onClick={() => navigate("/admin/paid-access")}
                      className="cursor-pointer"
                    >
                      Seznam plateb
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onClick={() => navigate("/manual-help-management")}
                    className="cursor-pointer"
                  >
                    Mé návody
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="flex items-center gap-2 border-l pl-2 md:pl-4 border-accent-foreground/10">
            {isAuthenticated ? (
              /* PŘIHLÁŠENÝ UŽIVATEL */
              <>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full p-0 focus-visible:ring-0"
                      aria-label="Inbox notifikaci"
                    >
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 py-0 text-[10px] leading-none">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    className="w-80"
                    align="end"
                    sideOffset={10}
                  >
                    <DropdownMenuLabel className="flex items-center justify-between">
                      <span>Inbox</span>
                      {inboxItems.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={deleteAllInboxItems}
                          >
                            Smazat vše
                          </Button>
                        </div>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {inboxItems.length === 0 && (
                      <DropdownMenuItem disabled>
                        Zatím žádné notifikace.
                      </DropdownMenuItem>
                    )}
                    {inboxItems.length > 0 && (
                      <div className="max-h-60 overflow-y-auto">
                        {inboxItems.map((item) => (
                          <div key={item.id} className="px-2 py-1.5">
                            <div className="flex w-full items-start justify-between gap-2 rounded-sm">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">
                                    {item.title}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    {getInboxTypeLabel(item.type)}
                                  </Badge>
                                  {!item.isRead && (
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {item.message}
                                </p>
                              </div>
                              <button
                                type="button"
                                aria-label="Smazat zprávu"
                                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  deleteInboxItem(item.id);
                                }}
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {inboxItems.length > 0 && hasMoreInboxItems && (
                      <div className="border-t px-2 py-1.5">
                        <Button
                          variant="ghost"
                          className="h-7 w-full text-xs"
                          onClick={() => {
                            void loadMoreInboxItems();
                          }}
                          disabled={isLoadingMoreInbox}
                        >
                          {isLoadingMoreInbox ? "Načítám..." : "Načíst další"}
                        </Button>
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

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
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {!isAdmin && (
                      <>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => navigate("/my-requests")}
                        >
                          Mé žádosti
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
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
                      <span>
                        {isLoggingOut ? "Odhlašování..." : "Odhlásit se"}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
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
