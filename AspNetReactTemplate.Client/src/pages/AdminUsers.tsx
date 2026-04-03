import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Users, Loader2, Save } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiService } from "@/lib/apiService";
import { editableRoles, type AdminUserRow } from "@/types/adminUser";
import { Role } from "@/types/auth";

const getCurrentRole = (roles: string) => {
  const first = roles.split(",")[0]?.trim();
  return editableRoles.includes(first as Role) ? (first as Role) : Role.User;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [draftRoles, setDraftRoles] = useState<Record<number, Role>>({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getUsers();
        setUsers(data);
        setDraftRoles(
          Object.fromEntries(data.map((user) => [user.id, getCurrentRole(user.roles)])),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Nepodařilo se načíst uživatele.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const totalUsers = useMemo(() => users.length, [users.length]);

  const getDisplayName = (user: AdminUserRow) => {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : user.username ?? `Uživatel #${user.id}`;
  };

  const handleSave = async (userId: number) => {
    const nextRole = draftRoles[userId];
    if (!nextRole) return;

    try {
      setSavingId(userId);
      setError(null);
      setSuccessMessage(null);
      const response = await apiService.setUserRole(userId, nextRole);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, roles: nextRole } : user,
        ),
      );
      setSuccessMessage(response.message || "Role byla úspěšně nastavena.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Změna role se nezdařila.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <div className="border-b border-border bg-card px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Admin
              </p>
              <h1 className="text-2xl font-bold">Uživatelé a role</h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Přehled všech uživatelů a možnost přepnout jejich roli přímo v tabulce.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-3 size-6 animate-spin" />
            Načítám uživatele...
          </div>
        )}

        {!loading && error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && successMessage && !error && (
          <Alert>
            <ShieldCheck className="size-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <Users className="mb-3 size-10 opacity-30" />
            <p className="text-lg font-medium">Žádní uživatelé nebyli nalezeni.</p>
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <Card className="overflow-hidden border-border/70 bg-card shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg">
                Seznam uživatelů <span className="text-muted-foreground">({totalUsers})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
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
                    {users.map((user, idx) => {
                      const currentRole = draftRoles[user.id] ?? getCurrentRole(user.roles);
                      const changed = currentRole !== getCurrentRole(user.roles);

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
                                <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{user.email || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{user.phone || "—"}</td>
                          <td className="px-4 py-3">
                            <select
                              value={currentRole}
                              onChange={(event) =>
                                setDraftRoles((prev) => ({
                                  ...prev,
                                  [user.id]: event.target.value as Role,
                                }))
                              }
                              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                            >
                              {editableRoles.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              type="button"
                              size="sm"
                              disabled={savingId === user.id || !changed}
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
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

