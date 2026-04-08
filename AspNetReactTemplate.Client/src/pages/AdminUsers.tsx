import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  Search,
  X,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AdminUserRoleEditor from "@/components/domains/admin/AdminUserRoleEditor";
import { apiService } from "@/lib/apiService";
import { editableRoles, type AdminUserRow } from "@/types/adminUser";
import { Role } from "@/types/auth";
import { useUserFilters } from "@/hooks/useUserFilters";
import { useAuth } from "@/hooks/useAuth";

type NoticeType = "success" | "error";

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

const isSortByOption = (value: string): value is SortByOption =>
  SORT_BY_OPTIONS.includes(value as SortByOption);

const getCurrentRole = (roles: string) => {
  const first = roles.split(",")[0]?.trim();
  return editableRoles.includes(first as Role) ? (first as Role) : Role.User;
};

export default function AdminUsers() {
  const { user: loggedInUser } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [draftRoles, setDraftRoles] = useState<Record<number, Role>>({});
  const [notice, setNotice] = useState<{ type: NoticeType; message: string } | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingRoleChange, setPendingRoleChange] = useState<PendingRoleChange | null>(null);

  const { filters, setSearch, setRole, setSortDirection, setSortBy, setPage } = useUserFilters();
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

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
      setNotice({ type: "error", message });
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
    return parts.length > 0 ? parts.join(" ") : user.username ?? `Uživatel #${user.id}`;
  };

  const pageStart = totalItems === 0 ? 0 : (filters.page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(filters.page * PAGE_SIZE, totalItems);

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
    if (requiresDoubleConfirmation && pendingRoleChange.confirmationStep === 1) {
      setPendingRoleChange((prev) =>
        prev ? { ...prev, confirmationStep: 2 } : null,
      );
      return;
    }

    // Save role change
    try {
      setSavingId(pendingRoleChange.userId);
      setNotice(null);

      if (isExpertRemoval) {
        const assignedManuals = await apiService.getManualsForExpert(
          pendingRoleChange.userId,
        );

        await Promise.all(
          assignedManuals.map((manual) =>
            apiService.removeManualFromExpert(manual.manualId, pendingRoleChange.userId),
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
      setNotice({
        type: "success",
        message:
          response.message ||
          (isExpertRemoval
            ? "Role byla úspěšně nastavena a všechna přiřazení experta byla odstraněna."
            : "Role byla úspěšně nastavena."),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Změna role se nezdařila.";
      setNotice({ type: "error", message });
    } finally {
      setSavingId(null);
      setPendingRoleChange(null);
    }
  };

  const isAdminRoleChange =
    pendingRoleChange?.nextRole === Role.Admin ||
    pendingRoleChange?.currentRole === Role.Admin;
  const isExpertRoleRemoval =
    pendingRoleChange?.currentRole === Role.Expert &&
    pendingRoleChange?.nextRole !== Role.Expert;
  const isExpertToAdminChange =
    pendingRoleChange?.currentRole === Role.Expert &&
    pendingRoleChange?.nextRole === Role.Admin;
  const requiresDoubleConfirmation =
    Boolean(pendingRoleChange) && (isAdminRoleChange || isExpertRoleRemoval);
  const roleChange = pendingRoleChange;


  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {notice && (
        <div className="fixed bottom-4 right-4 z-100 w-full max-w-sm">
          <Alert
            variant={notice.type === "error" ? "destructive" : "default"}
            className={
              notice.type === "error"
                ? undefined
                : "border-primary/50 bg-primary/70 text-black shadow-lg shadow-primary/20 [&_svg]:text-black"
            }
          >
            <AlertDescription className="flex items-start justify-between gap-3 !text-black">
              <span className="whitespace-pre-line !text-black">{notice.message}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="rounded-sm opacity-80 transition hover:opacity-100 !text-black"
                aria-label="Zavřít oznámení"
              >
                <X className="size-4" />
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Card className="overflow-hidden border-border/70 bg-card shadow-sm">
            <CardHeader className="border-b border-border">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-2xl font-bold">
                  Správa uživatelů
                  {isRefreshing && <Loader2 className="ml-2 inline size-4 animate-spin text-muted-foreground" />}
                </CardTitle>

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
                      setSortDirection(filters.sortDirection === "asc" ? "desc" : "asc");
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
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/40">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Uživatel
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        E-mail
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Telefon
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Akce
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isInitialLoading && users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            Načítám uživatele...
                          </span>
                        </td>
                      </tr>
                    )}

                    {users.map((user, idx) => {
                      const currentRole = draftRoles[user.id] ?? getCurrentRole(user.roles);
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
                                <div className="font-medium">{getDisplayName(user)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{user.email || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{user.phone || "—"}</td>
                          <td className="px-4 py-3">
                            <AdminUserRoleEditor
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
                              <p className="mt-1 text-xs text-muted-foreground px-1">
                                Nemůžete si změnit vlastní roli.
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              type="button"
                              size="sm"
                              variant={isSelf ? "secondary" : "default"}
                              className={isSelf ? "bg-muted text-muted-foreground" : undefined}
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
                </table>
              </div>

              {!isInitialLoading && users.length === 0 && (
                <div className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  Pro zadané filtry nebyl nalezen žádný uživatel.
                </div>
              )}

              {totalItems > 0 && (
                <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
                  <span className="text-muted-foreground">
                    Zobrazeno {pageStart}-{pageEnd} z {totalItems}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, filters.page - 1))}
                      disabled={filters.page <= 1}
                    >
                      <ChevronLeft className="size-4" />
                      Předchozí
                    </Button>

                    <span className="min-w-24 text-center text-muted-foreground">
                      Strana {filters.page} / {totalPages}
                    </span>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, filters.page + 1))}
                      disabled={filters.page >= totalPages}
                    >
                      Další
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
      </main>

      {/* Popup for role changes - idk if it is well done */}
      <Dialog
        open={Boolean(pendingRoleChange && pendingRoleChange.confirmationStep > 0)}
        onOpenChange={() => setPendingRoleChange(null)}
      >
        <DialogContent>
          {roleChange && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {roleChange.confirmationStep === 2
                    ? isExpertRoleRemoval
                      ? "Potvrzení odebrání role Expert"
                      : "Potvrzení Admin role"
                    : isExpertRoleRemoval
                      ? "Potvrzení změny role Expert"
                      : "Potvrzení změny role"}
                </DialogTitle>
                <DialogDescription>
                  {roleChange.confirmationStep === 1 ? (
                    <>
                      <p className="mb-2">
                        Chcete změnit roli uživatele{" "}
                        <strong>{roleChange.userName}</strong>?
                      </p>
                      <p className="text-sm">
                        Z: <strong>{roleChange.currentRole}</strong> →
                        Na: <strong>{roleChange.nextRole}</strong>
                      </p>
                      {requiresDoubleConfirmation && !isExpertToAdminChange && (
                        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                          ⚠️ <strong>Upozornění!</strong>{" "}
                          {isExpertRoleRemoval
                            ? "Tímto se odebere role Expert a smažou se všechna přiřazení tohoto uživatele k návodům."
                            : "Jedná se o změnu Admin role. Tato akce vyžaduje dodatečné potvrzení."}
                        </div>
                      )}
                      {isExpertToAdminChange && (
                        <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                          ⚠️ <strong>Upozornění!</strong> Přechod z Expert na Admin je
                          citlivá změna. Uživatel získá plná administrátorská práva a
                          zároveň přijde o všechna přiřazení experta k návodům.
                        </div>
                      )}
                    </>
                  ) : isExpertToAdminChange ? (
                    <>
                      <p className="mb-3 font-semibold text-destructive">
                        ⚠️ Souhrn změny z Expert na Admin
                      </p>
                      <p className="mb-2">
                        Opravdu chcete změnit roli uživatele{" "}
                        <strong>{roleChange.userName}</strong>?
                      </p>
                      <p className="mb-3 text-sm">
                        Z: <strong>{roleChange.currentRole}</strong> →
                        Na: <strong>{roleChange.nextRole}</strong>
                      </p>
                      <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/15 p-3">
                        <p className="text-sm font-semibold text-destructive">
                          Tato změna provede vše níže:
                        </p>
                        <ul className="list-disc space-y-1 ps-5 text-sm text-destructive">
                          <li>Uživatel získá administrátorská práva.</li>
                          <li>Bude moci spravovat uživatele, návody i nástroje.</li>
                          <li>Současně se smažou všechna jeho expertní přiřazení k návodům.</li>
                          <li>Expert přiřazení nebude možné vrátit bez ručního znovupřiřazení.</li>
                        </ul>
                      </div>
                    </>
                  ) : isExpertRoleRemoval ? (
                    <>
                      <p className="mb-3 font-semibold text-destructive">
                        ⚠️ Finální potvrzení odebrání role Expert
                      </p>
                      <p className="mb-2">
                        Opravdu chcete změnit roli uživatele{" "}
                        <strong>{roleChange.userName}</strong>?
                      </p>
                      <p className="mb-3 text-sm">
                        Z: <strong>{roleChange.currentRole}</strong> →
                        Na: <strong>{roleChange.nextRole}</strong>
                      </p>
                      <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/15 p-3">
                        <p className="text-sm font-semibold text-destructive">
                          Tato akce smaže všechna přiřazení experta k návodům:
                        </p>
                        <ul className="list-disc space-y-1 ps-5 text-sm text-destructive">
                          <li>Uživatel přestane být vedený jako expert</li>
                          <li>Budou odstraněna všechna jeho přiřazení k návodům</li>
                          <li>Přiřazení nebude možné obnovit bez ručního znovupřiřazení</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mb-3 font-semibold text-destructive">
                        ⚠️ Finální potvrzení změny Admin role
                      </p>
                      <p className="mb-2">
                        Opravdu chcete změnit roli uživatele{" "}
                        <strong>{roleChange.userName}</strong>?
                      </p>
                      <p className="mb-3 text-sm">
                        Z: <strong>{roleChange.currentRole}</strong> →
                        Na: <strong>{roleChange.nextRole}</strong>
                      </p>
                      <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/15 p-3">
                        <p className="text-sm font-semibold text-destructive">
                          Admin má zpřístupněnou správu systému, což zahrnuje:
                        </p>
                        <ul className="list-disc space-y-1 ps-5 text-sm text-destructive">
                          <li>Správu všech uživatelů a jejich rolí</li>
                          <li>Správu návodů a přiřazení expertů</li>
                          <li>Správu nástrojů v systému</li>
                        </ul>
                      </div>
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPendingRoleChange(null)}
                >
                  Zrušit
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmRoleChange}
                  disabled={savingId !== null}
                  variant={
                    isAdminRoleChange || isExpertRoleRemoval
                      ? "destructive"
                      : "default"
                  }
                >
                  {savingId !== null ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Ukládám...
                    </>
                  ) : roleChange.confirmationStep === 2 ? (
                    isExpertToAdminChange
                      ? "Potvrzuji změnu Expert → Admin"
                      : isExpertRoleRemoval
                        ? "Potvrzuji odebrání role Expert"
                        : "Potvrzuji změnu Admin role"
                  ) : (
                    "Potvrdit"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

