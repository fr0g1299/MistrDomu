import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/types/auth";

type AdminUserRoleEditorProps = {
  userId: number;
  draftRole: Role;
  editableRoles: readonly Role[];
  onDraftRoleChange: (userId: number, role: Role) => void;
  disabled?: boolean;
};

export default function AdminUserRoleEditor({
  userId,
  draftRole,
  editableRoles,
  onDraftRoleChange,
  disabled = false,
}: AdminUserRoleEditorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 min-w-44 justify-between bg-background px-3 text-left font-normal text-foreground"
          disabled={disabled}
        >
          <span>{draftRole}</span>
          <ChevronDown className="size-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="min-w-44 border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        align="start"
      >
        <DropdownMenuRadioGroup
          value={draftRole}
          onValueChange={(value) => onDraftRoleChange(userId, value as Role)}
        >
          {editableRoles.map((role) => (
            <DropdownMenuRadioItem
              key={role}
              value={role}
              className="text-zinc-900 focus:text-zinc-900 dark:text-zinc-100 dark:focus:text-zinc-100"
            >
              {role}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

