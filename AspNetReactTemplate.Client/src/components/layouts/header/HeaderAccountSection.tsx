import { Bell, Loader2, LogOut, X } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthDialog } from "@/components/identity/AuthDialog";
import { cn } from "@/lib/utils";
import type { User } from "@/types/auth";
import type { NotificationListItem } from "@/types/notification";

type HeaderAccountSectionProps = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isExpert: boolean;
  isLoggingOut: boolean;
  user?: User | null;
  initials: string;
  unreadCount: number;
  inboxItems: NotificationListItem[];
  isInboxOpen: boolean;
  onInboxOpenChange: (open: boolean) => void;
  onOpenInboxItem: (item: NotificationListItem) => void;
  onDeleteInboxItem: (id: number) => void;
  onDeleteAllInboxItems: () => void;
  onNavigateMyRequests: () => void;
  onLogout: () => void;
  onLoginSuccess: () => unknown | Promise<unknown>;
};

export default function HeaderAccountSection({
  isAuthenticated,
  isAdmin,
  isExpert,
  isLoggingOut,
  user,
  initials,
  unreadCount,
  inboxItems,
  isInboxOpen,
  onInboxOpenChange,
  onOpenInboxItem,
  onDeleteInboxItem,
  onDeleteAllInboxItems,
  onNavigateMyRequests,
  onLogout,
  onLoginSuccess,
}: HeaderAccountSectionProps) {
  const roleLabel = isAdmin ? "Admin" : isExpert ? "Expert" : "User";
  const showRoleBadge = isAdmin || isExpert;

  if (!isAuthenticated) {
    return (
      <div className="inline-flex">
        <AuthDialog onLoginSuccess={onLoginSuccess} />
      </div>
    );
  }

  return (
    <>
      <DropdownMenu
        modal={false}
        open={isInboxOpen}
        onOpenChange={onInboxOpenChange}
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

        <DropdownMenuContent
          className="w-88 sm:w-[24rem]"
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
                  onClick={onDeleteAllInboxItems}
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
            <div className="solid-scrollbar max-h-60 overflow-y-auto pr-1">
              {inboxItems.map((item) => (
                <div key={item.id} className="px-1.5 py-1.25">
                  <div
                    className={cn(
                      "relative flex w-full cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                      item.isRead
                        ? "border-border/60 bg-card hover:border-zinc-700 hover:bg-card/60"
                        : "border-primary/15 bg-primary/4 hover:border-primary/30 hover:bg-primary/8",
                    )}
                    role="button"
                    tabIndex={0}
                    aria-label={`Otevřít notifikaci ${item.title}`}
                    onClick={() => onOpenInboxItem(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onOpenInboxItem(item);
                      }
                    }}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5 pr-7">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[0.92rem] font-semibold leading-tight text-foreground">
                          {item.title}
                        </span>
                        {!item.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-[0.8rem] leading-snug text-muted-foreground">
                        {item.message}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Smazat zprávu"
                      className="absolute right-1.5 top-1.5 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onDeleteInboxItem(item.id);
                      }}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
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
            <span className="hidden md:inline-flex items-center gap-2 max-w-60 overflow-hidden whitespace-nowrap">
              <span className="text-sm font-medium text-foreground overflow-hidden text-ellipsis">
                {user?.firstName} {user?.lastName}
              </span>
              {showRoleBadge && (
                <Badge
                  variant="secondary"
                  className="h-5 rounded-full border-primary/20 bg-primary/10 px-2 py-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary"
                >
                  {roleLabel}
                </Badge>
              )}
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
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium leading-none">Můj účet</p>
                {showRoleBadge && (
                  <Badge
                    variant="secondary"
                    className="h-5 rounded-full border-primary/20 bg-primary/10 px-2 py-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary"
                  >
                    {roleLabel}
                  </Badge>
                )}
              </div>
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
                onClick={onNavigateMyRequests}
              >
                Mé žádosti
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            className="text-red-500 focus:bg-red-50 dark:focus:bg-red-950 focus:text-red-500 cursor-pointer"
            onClick={onLogout}
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
    </>
  );
}
