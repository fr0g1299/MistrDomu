import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { apiService } from "@/lib/apiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RoleRequestFilter, UserRoleRequestItem } from "@/types/roleRequest";
import { useAuth } from "@/hooks/useAuth";

const PAGE_SIZE = 10;

const formatStatus = (status: string) => {
  if (status === "Approved") return "Schváleno";
  if (status === "Rejected") return "Zamítnuto";
  return "Čeká";
};

const getStatusClasses = (status: string) => {
  if (status === "Approved") {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  }

  if (status === "Rejected") {
    return "bg-red-500/15 text-red-300 border-red-500/30";
  }

  return "bg-amber-500/15 text-amber-300 border-amber-500/30";
};

const formatType = (type: string) => {
  if (type === "Expert") return "Role Expert";
  return type;
};

export default function MyRoleRequests() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const [items, setItems] = useState<UserRoleRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RoleRequestFilter>("all");
  const previousSnapshotRef = useRef<Map<number, string>>(new Map());
  const highlightTimeoutsRef = useRef<number[]>([]);

  const buildSnapshotKey = (item: UserRoleRequestItem) =>
    `${item.status}|${item.reviewedAtUtc ?? ""}`;

  const load = useCallback(async (targetPage: number) => {
    try {
      if (!hasLoadedOnce) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const data = await apiService.getMyRoleRequests({
        page: targetPage,
        pageSize: PAGE_SIZE,
        status: statusFilter,
      });

      const nextSnapshot = new Map<number, string>();
      for (const item of data.items) {
        nextSnapshot.set(item.id, buildSnapshotKey(item));
      }

      if (hasLoadedOnce) {
        const changedIds = data.items
          .filter((item) => {
            const previous = previousSnapshotRef.current.get(item.id);
            return previous !== undefined && previous !== buildSnapshotKey(item);
          })
          .map((item) => item.id);

        if (changedIds.length > 0) {
          setRecentlyUpdatedIds((prev) => Array.from(new Set([...prev, ...changedIds])));

          const timeoutId = window.setTimeout(() => {
            setRecentlyUpdatedIds((prev) => prev.filter((id) => !changedIds.includes(id)));
          }, 4000);

          highlightTimeoutsRef.current.push(timeoutId);
        }
      }

      previousSnapshotRef.current = nextSnapshot;

      setItems(data.items);
      setPage(data.currentPage || 1);
      setTotalItems(data.totalItems);
      setTotalPages(Math.max(1, data.totalPages || 1));
      setHasLoadedOnce(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nepodařilo se načíst žádosti.");
    } finally {
      if (!hasLoadedOnce) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, [hasLoadedOnce, statusFilter]);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void load(page);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [load, page]);

  useEffect(() => {
    const handleUserUpdate = () => {
      void load(page);
    };

    window.addEventListener("role-request-user-updated", handleUserUpdate);
    return () => window.removeEventListener("role-request-user-updated", handleUserUpdate);
  }, [load, page]);

  useEffect(() => {
    return () => {
      highlightTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      highlightTimeoutsRef.current = [];
    };
  }, []);

  const hasActiveFilters = statusFilter !== "all";


  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mé žádosti</CardTitle>
              {isAdmin && (
                <CardDescription className="mt-1 text-amber-500">
                  Admin nemůže žádat o roli Expert.
                </CardDescription>
              )}
            </div>
            <Button
              type="button"
              disabled={isAdmin}
              onClick={() =>
                navigate("/my-requests/new", {
                  state: { backgroundLocation: location },
                })
              }
            >
              <Plus className="size-4" />
              Vytvořit žádost
            </Button>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <CardTitle className="md:mr-auto">
                Výpis žádostí
                {isRefreshing && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    Aktualizuji...
                  </span>
                )}
              </CardTitle>

              <div className="flex w-full justify-end md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as RoleRequestFilter);
                    setPage(1);
                  }}
                  style={{ colorScheme: "dark" }}
                  className="h-9 min-w-40 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  <option value="all">Všechny stavy</option>
                  <option value="pending">Čeká</option>
                  <option value="approved">Schváleno</option>
                  <option value="rejected">Zamítnuto</option>
                </select>

              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Typ</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Stav</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Podáno</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Vyřízeno</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !hasLoadedOnce && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" /> Načítám...
                        </span>
                      </td>
                    </tr>
                  )}

                  {!loading && items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        {statusFilter === "pending"
                          ? "Aktuálně nemáš žádné čekající žádosti."
                          : statusFilter === "approved"
                            ? "Aktuálně nemáš žádné schválené žádosti."
                            : statusFilter === "rejected"
                              ? "Aktuálně nemáš žádné zamítnuté žádosti."
                              : "Zatím nemáš žádné žádosti."}
                      </td>
                    </tr>
                  )}

                  {items.map((item, index) => (
                    <tr
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Otevřít detail žádosti ${item.id}`}
                      className={`border-b border-border transition-colors focus:outline-none focus-visible:bg-muted/35 hover:bg-muted/25 ${
                        recentlyUpdatedIds.includes(item.id)
                          ? "bg-primary/10"
                          : index % 2 === 0
                            ? ""
                            : "bg-muted/10"
                      } cursor-pointer`}
                      onClick={() =>
                        navigate(`/my-requests/${item.id}`, {
                          state: { backgroundLocation: location },
                        })
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/my-requests/${item.id}`, {
                            state: { backgroundLocation: location },
                          });
                        }
                      }}
                    >
                      <td className="px-4 py-3 font-medium">{formatType(item.requestType)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span
                          className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${getStatusClasses(item.status)}`}
                        >
                          {formatStatus(item.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(item.requestedAtUtc).toLocaleString("cs-CZ")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.reviewedAtUtc
                          ? new Date(item.reviewedAtUtc).toLocaleString("cs-CZ")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
              <span className="text-muted-foreground">
                Na stránce zobrazeno {items.length}
                {hasActiveFilters ? " (filtrováno)" : ""} • Celkem {totalItems}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1 || loading || isRefreshing}
                >
                  <ChevronLeft className="size-4" />
                  Předchozí
                </Button>
                <span className="min-w-24 text-center text-muted-foreground">
                  Strana {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages || loading || isRefreshing}
                >
                  Další
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

