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
import { Bell, BookOpen, LogOut, Loader2, Settings, X } from "lucide-react";
import type { RoleRequestSummary } from "@/types/roleRequest";

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
  const [isSubmittingExpertRequest, setIsSubmittingExpertRequest] =
    useState(false);
  const [expertRequestPending, setExpertRequestPending] = useState(false);
  const [myExpertRequest, setMyExpertRequest] =
    useState<RoleRequestSummary | null>(null);

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
      const notifications = await apiService.getMyNotifications({ page: 1, pageSize: INBOX_PAGE_SIZE });
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
        const newItems = notifications.items.filter((item) => !knownIds.has(item.id));
        return [...current, ...newItems];
      });
      setInboxUnreadCount(notifications.unreadCount);
      setInboxCurrentPage(notifications.currentPage);
      setInboxTotalPages(notifications.totalPages);
    } catch {
      toast.error("Nacitani dalsich notifikaci se nezdarilo.");
    } finally {
      setIsLoadingMoreInbox(false);
    }
  }, [hasMoreInboxItems, inboxCurrentPage, isAuthenticated, isLoadingMoreInbox]);

  const markAllAsRead = useCallback(() => {
    const previousItems = inboxItems;
    const previousUnreadCount = inboxUnreadCount;

    setInboxItems((current) => current.map((item) => ({ ...item, isRead: true })));
    setInboxUnreadCount(0);

    void apiService.markAllNotificationsAsRead().catch((error) => {
      setInboxItems(previousItems);
      setInboxUnreadCount(previousUnreadCount);
      toast.error(error instanceof Error ? error.message : "Oznaceni notifikaci jako prectene selhalo.");
      void refreshHeaderNotifications();
    });
  }, [inboxItems, inboxUnreadCount, refreshHeaderNotifications]);

  const deleteInboxItem = useCallback((id: number) => {
    setInboxItems((current) => {
      const target = current.find((item) => item.id === id);
      if (!target) {
        return current;
      }

      if (!target.isRead) {
        setInboxUnreadCount((prev) => Math.max(0, prev - 1));
      }

      return current.filter((item) => item.id !== id);
    });

    void apiService.deleteNotification(id).catch((error) => {
      toast.error(error instanceof Error ? error.message : "Smazani zpravy se nezdarilo.");
      void refreshHeaderNotifications();
    });
  }, [refreshHeaderNotifications]);

  useEffect(() => {
    const loadMyRequestState = async () => {
      if (!isAuthenticated || isAdmin || isExpert) {
        setExpertRequestPending(false);
        setMyExpertRequest(null);
        return;
      }

      try {
        const request = await apiService.getMyExpertRoleRequest();
        setMyExpertRequest(request);
        setExpertRequestPending(request?.status === "Pending");
      } catch {
        setExpertRequestPending(false);
        setMyExpertRequest(null);
      }
    };

    void loadMyRequestState();
  }, [isAdmin, isAuthenticated, isExpert]);

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

  const getRequestStatusLabel = (status?: string) => {
    if (status === "Approved") return "Schváleno";
    if (status === "Rejected") return "Zamítnuto";
    return "Čeká na vyřízení";
  };

  const getInboxTypeLabel = (type?: string) => {
    if (type === "role_request_admin") return "Admin";
    if (type === "role_request") return "Zadost";
    return "Info";
  };

  const handleRequestExpertRole = useCallback(async () => {
    try {
      setIsSubmittingExpertRequest(true);
      const createdRequest = await apiService.createExpertRoleRequest();
      setMyExpertRequest(createdRequest);
      setExpertRequestPending(true);
      toast.success("Žádost o roli Expert byla odeslána.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Odeslání žádosti se nezdařilo.",
      );
    } finally {
      setIsSubmittingExpertRequest(false);
    }
  }, []);

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
                <DropdownMenu
                  modal={false}
                  onOpenChange={(open) => {
                    if (!open || unreadCount === 0) {
                      return;
                    }

                    markAllAsRead();
                  }}
                >
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

                  <DropdownMenuContent className="w-80" align="end" sideOffset={10}>
                    <DropdownMenuLabel className="flex items-center justify-between">
                      <span>Inbox</span>
                      {inboxItems.length > 0 && (
                        <Button
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={markAllAsRead}
                        >
                          Oznacit vse jako prectene
                        </Button>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {inboxItems.length === 0 && (
                      <DropdownMenuItem disabled>Zatim zadne notifikace.</DropdownMenuItem>
                    )}
                    {inboxItems.length > 0 && (
                      <div className="max-h-60 overflow-y-auto">
                        {inboxItems.map((item) => (
                          <div key={item.id} className="px-2 py-1.5">
                            <div className="flex w-full items-start justify-between gap-2 rounded-sm">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">{item.title}</span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {getInboxTypeLabel(item.type)}
                                  </Badge>
                                  {!item.isRead && (
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{item.message}</p>
                              </div>
                              <button
                                type="button"
                                aria-label="Smazat zpravu"
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
                          {isLoadingMoreInbox ? "Nacitam..." : "Nacist dalsi"}
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
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => navigate("/my-requests")}
                  >
                    Moje žádosti
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {!isAdmin && !isExpert && (
                    <>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        disabled={
                          isSubmittingExpertRequest || expertRequestPending
                        }
                        onClick={handleRequestExpertRole}
                      >
                        {expertRequestPending
                          ? "Žádost o Expert roli odeslána"
                          : isSubmittingExpertRequest
                            ? "Odesílám žádost..."
                            : "Požádat o roli Expert"}
                      </DropdownMenuItem>

                      {myExpertRequest && (
                        <div className="px-2 py-2 text-xs text-muted-foreground">
                          <p>
                            Stav žádosti:{" "}
                            <span className="text-foreground">
                              {getRequestStatusLabel(myExpertRequest.status)}
                            </span>
                          </p>
                          {myExpertRequest.adminNote?.trim() && (
                            <p className="mt-1 wrap-break-word">
                              Poznámka admina:{" "}
                              <span className="text-foreground">
                                {myExpertRequest.adminNote}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
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
