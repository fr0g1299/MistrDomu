import { useCallback, useEffect, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ, Loader2, Save, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AdminDataTable,
  AdminTableCard,
  AdminTableHead,
  AdminTablePagination,
  AdminTableStateRow,
  type AdminTableColumn,
} from "@/components/domains/admin/TableLayout";
import { RoleChangeDialog } from "@/components/domains/admin/users/RoleChangeDialog";
import RoleEditor from "@/components/domains/admin/users/RoleEditor";
import { apiService } from "@/lib/apiService";
import { editableRoles, type AdminUserRow } from "@/types/adminUser";
import { Role } from "@/types/auth";
import { useUserFilters } from "@/hooks/useUserFilters";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type PendingRoleChange = {
  userId: number;
  userName: string;
  currentRole: Role;
  nextRole: Role;
  confirmationStep: number; // 0 = closed, 1 = first confirm (or direct save if not admin), 2 = second confirm (only for admin changes)
};

const PAGE_SIZE = 10;
const SORT_BY_OPTIONS = ["lastName", "role"] as const;
type SortByOption = (typeof SORT_BY_OPTIONS)[number];

const ADMIN_USERS_COLUMNS: AdminTableColumn[] = [
  { key: "user", label: "Uživatel" },
  { key: "email", label: "E-mail" },
  { key: "phone", label: "Telefon" },
  { key: "call-duration", label: "Délka hovorů" },
  { key: "wait-duration", label: "Doba čekání" },
  { key: "role", label: "Role" },
  { key: "actions", label: "Akce" },
];

const isSortByOption = (value: string): value is SortByOption =>
  SORT_BY_OPTIONS.includes(value as SortByOption);

const getCurrentRole = (roles: string) => {
  const first = roles.split(",")[0]?.trim();
  return editableRoles.includes(first as Role) ? (first as Role) : Role.User;
};

const formatCallDuration = (totalSeconds: number) => {
  if (!totalSeconds || totalSeconds <= 0) {
    return "0:00";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export default function AdminUsers() {
  const { user: loggedInUser } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [draftRoles, setDraftRoles] = useState<Record<number, Role>>({});
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingRoleChange, setPendingRoleChange] =
    useState<PendingRoleChange | null>(null);

  const { filters, setSearch, setRole, setSortDirection, setSortBy, setPage } =
    useUserFilters();
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput === filters.search) {
        return;
      }

      setSearch(searchInput);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [filters.search, searchInput, setPage, setSearch]);

  const loadUsers = useCallback(async () => {
    try {
      if (hasLoadedOnce) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoading(true);
      }

      const result = await apiService.getUsers({
        search: filters.search,
        role: filters.role || undefined,
        sortDirection: filters.sortDirection,
        sortBy: filters.sortBy,
        page: filters.page,
        pageSize: PAGE_SIZE,
      });

      setUsers(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
      setHasLoadedOnce(true);

      setDraftRoles((prev) => {
        const next: Record<number, Role> = {};
        for (const user of result.items) {
          next[user.id] = prev[user.id] ?? getCurrentRole(user.roles);
        }
        return next;
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Nepodařilo se načíst uživatele.";
      toast.error(message);
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, hasLoadedOnce]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const getDisplayName = (user: AdminUserRow) => {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0
      ? parts.join(" ")
      : (user.username ?? `Uživatel #${user.id}`);
  };

  const handleSave = (userId: number) => {
    const nextRole = draftRoles[userId];
    const user = users.find((u) => u.id === userId);
    if (!nextRole || !user) return;

    const currentRole = getCurrentRole(user.roles);

    setPendingRoleChange({
      userId,
      userName: getDisplayName(user),
      currentRole,
      nextRole,
      confirmationStep: 1,
    });
  };

  const handleConfirmRoleChange = async () => {
    if (!pendingRoleChange) return;

    const isAdminChange =
      pendingRoleChange.nextRole === Role.Admin ||
      pendingRoleChange.currentRole === Role.Admin;
    const isExpertRemoval =
      pendingRoleChange.currentRole === Role.Expert &&
      pendingRoleChange.nextRole !== Role.Expert;
    const requiresDoubleConfirmation = isAdminChange || isExpertRemoval;

    // Sensitive change - require double confirmation
    if (
      requiresDoubleConfirmation &&
      pendingRoleChange.confirmationStep === 1
    ) {
      setPendingRoleChange((prev) =>
        prev ? { ...prev, confirmationStep: 2 } : null,
      );
      return;
    }

    // Save role change
    try {
      setSavingId(pendingRoleChange.userId);

      if (isExpertRemoval) {
        const assignedManuals = await apiService.getManualsForExpert(
          pendingRoleChange.userId,
        );

        await Promise.all(
          assignedManuals.map((manual) =>
            apiService.removeManualFromExpert(
              manual.manualId,
              pendingRoleChange.userId,
            ),
          ),
        );
      }

      const response = await apiService.setUserRole(
        pendingRoleChange.userId,
        pendingRoleChange.nextRole,
      );
      setUsers((prev) =>
        prev.map((user) =>
          user.id === pendingRoleChange.userId
            ? { ...user, roles: pendingRoleChange.nextRole }
            : user,
        ),
      );
      void loadUsers();
      toast.success(
        response.message ||
          (isExpertRemoval
            ? "Role byla úspěšně nastavena a všechna přiřazení experta byla odstraněna."
            : "Role byla úspěšně nastavena."),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Změna role se nezdařila.";
      toast.error(message);
    } finally {
      setSavingId(null);
      setPendingRoleChange(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <main className="mx-auto max-w-7xl px-6 py-8">
        <AdminTableCard
          title={
            <>
              Správa uživatelů
              {isRefreshing && (
                <Loader2 className="ml-2 inline size-4 animate-spin text-muted-foreground" />
              )}
            </>
          }
          actions={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Hledat jméno, email, telefon..."
                  className="pl-9 text-foreground caret-foreground selection:bg-primary/60 selection:text-foreground"
                />
              </div>

              <select
                value={filters.role}
                onChange={(event) => {
                  setRole(event.target.value);
                  setPage(1);
                }}
                style={{ colorScheme: "dark" }}
                className="h-9 min-w-40 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">Všechny role</option>
                {editableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <select
                value={filters.sortBy}
                onChange={(event) => {
                  const nextSortBy = event.target.value;
                  if (!isSortByOption(nextSortBy)) {
                    return;
                  }

                  setSortBy(nextSortBy);
                  setPage(1);
                }}
                style={{ colorScheme: "dark" }}
                className="h-9 min-w-40 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="lastName">Řadit dle příjmení</option>
                <option value="role">Řadit dle role</option>
              </select>

              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={
                  filters.sortDirection === "asc"
                    ? "Přepnout směr řazení na sestupně"
                    : "Přepnout směr řazení na vzestupně"
                }
                onClick={() => {
                  setSortDirection(
                    filters.sortDirection === "asc" ? "desc" : "asc",
                  );
                  setPage(1);
                }}
              >
                {filters.sortDirection === "asc" ? (
                  <ArrowDownAZ className="size-4" />
                ) : (
                  <ArrowUpAZ className="size-4" />
                )}
              </Button>
            </div>
          }
        >
          <AdminDataTable>
            <AdminTableHead columns={ADMIN_USERS_COLUMNS} sticky />
            <tbody>
              {isInitialLoading && users.length === 0 && (
                <AdminTableStateRow
                  colSpan={7}
                  message="Načítám uživatele..."
                  loading
                />
              )}

              {users.map((user, idx) => {
                const currentRole =
                  draftRoles[user.id] ?? getCurrentRole(user.roles);
                const changed = currentRole !== getCurrentRole(user.roles);
                const isSelf = loggedInUser?.id === user.id;

                return (
                  <tr
                    key={user.id}
                    className={`border-b border-border last:border-0 transition-colors hover:bg-muted/30 ${
                      idx % 2 === 0 ? "" : "bg-muted/10"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          {getDisplayName(user).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">
                            {getDisplayName(user)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatCallDuration(user.totalCallDurationSeconds)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatCallDuration(user.totalWaitingDurationSeconds)}
                    </td>
                    <td className="px-4 py-3">
                      <RoleEditor
                        userId={user.id}
                        draftRole={currentRole}
                        editableRoles={editableRoles}
                        disabled={isSelf}
                        onDraftRoleChange={(targetUserId, role) =>
                          setDraftRoles((prev) => ({
                            ...prev,
                            [targetUserId]: role,
                          }))
                        }
                      />
                      {isSelf && (
                        <p className="mt-1 px-1 text-xs text-muted-foreground">
                          Nemůžete si změnit vlastní roli.
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelf ? "secondary" : "default"}
                        className={
                          isSelf ? "bg-muted text-muted-foreground" : undefined
                        }
                        disabled={savingId === user.id || !changed || isSelf}
                        onClick={() => handleSave(user.id)}
                      >
                        {savingId === user.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Save className="size-4" />
                        )}
                        Uložit
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminDataTable>

          {!isInitialLoading && users.length === 0 && (
            <div className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Pro zadané filtry nebyl nalezen žádný uživatel.
            </div>
          )}

          {totalItems > 0 && (
            <AdminTablePagination
              page={filters.page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </AdminTableCard>
      </main>

      <RoleChangeDialog
        open={Boolean(
          pendingRoleChange && pendingRoleChange.confirmationStep > 0,
        )}
        onOpenChange={() => setPendingRoleChange(null)}
        roleChange={pendingRoleChange}
        savingId={savingId}
        onConfirm={handleConfirmRoleChange}
      />
    </div>
  );
}
