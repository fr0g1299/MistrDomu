import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import type { ManagementNavAction } from "./types";

type HeaderManagementActionsProps = {
  actions: ManagementNavAction[];
  pendingExpertRequestCount: number;
  onNavigate: (path: string) => void;
  forceInline?: boolean;
};

const navButtonClass =
  "h-10 px-3 focus-visible:ring-0 select-none flex items-center gap-2";

export default function HeaderManagementActions({
  actions,
  pendingExpertRequestCount,
  onNavigate,
  forceInline,
}: HeaderManagementActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          forceInline
            ? "hidden lg:flex items-center gap-1"
            : "hidden xl:flex items-center gap-1",
        )}
      >
        {actions.map((action) => (
          <Button
            key={action.key}
            asChild
            variant="ghost"
            className={cn(
              navButtonClass,
              action.isActive && "bg-accent text-accent-foreground",
            )}
          >
            <Link to={action.to}>
              <span className="flex items-center gap-2">
                {action.icon}
                <span className="hidden md:inline">{action.label}</span>
              </span>
              {(action.badgeCount ?? 0) > 0 && (
                <Badge className="ml-1 h-4.5 min-w-4.5 justify-center px-1 py-0 text-[12px] leading-none font-extrabold">
                  {action.badgeCount}
                </Badge>
              )}
            </Link>
          </Button>
        ))}
      </div>

      <div className={cn(forceInline ? "lg:hidden" : "xl:hidden")}>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(`${navButtonClass} cursor-pointer`)}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Správa</span>
              {pendingExpertRequestCount > 0 && (
                <Badge className="ml-1 h-4.5 min-w-4.5 justify-center px-1 py-0 text-[12px] leading-none font-extrabold">
                  {pendingExpertRequestCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" sideOffset={10}>
            {actions.map((action) => (
              <DropdownMenuItem
                key={action.key}
                onClick={() => onNavigate(action.to)}
                className={cn(
                  "cursor-pointer",
                  action.isActive && "bg-accent text-accent-foreground",
                )}
              >
                {action.label}
                {(action.badgeCount ?? 0) > 0 && (
                  <Badge className="ml-2 h-5 min-w-5 justify-center px-1 py-0 text-[10px] leading-none">
                    {action.badgeCount}
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
