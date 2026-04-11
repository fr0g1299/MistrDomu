import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Check, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiService } from "@/lib/apiService";
import type {
  AdminRoleRequestItem,
  RoleRequestFilter,
} from "@/types/roleRequest";
import { toast } from "sonner";

const NOTE_MAX_LENGTH = 500;
const PAGE_SIZE = 10;

type ExpertRoleRequestsSectionProps = {
  className?: string;
};

export default function ExpertRoleRequestsSection({
  className,
}: ExpertRoleRequestsSectionProps) {
  const [items, setItems] = useState<AdminRoleRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RoleRequestFilter>("all");
  const isFirstLoadRef = useRef(true);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AdminRoleRequestItem | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<number[]>([]);
  const previousSnapshotRef = useRef<Map<number, string>>(new Map());
  const highlightTimeoutsRef = useRef<number[]>([]);

  const buildSnapshotKey = (item: AdminRoleRequestItem) =>
    `${item.status}|${item.reviewedAtUtc ?? ""}|${item.adminNote ?? ""}`;

  const loadRequests = useCallback(
    async (targetPage: number, options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

      try {
        if (!silent) {
          setLoading(true);
        }

        const data = await apiService.getPendingExpertRoleRequests({
          page: targetPage,
          pageSize: PAGE_SIZE,
          status: statusFilter,
        });

        const nextSnapshot = new Map<number, string>();
        for (const item of data.items) {
          nextSnapshot.set(item.id, buildSnapshotKey(item));
        }

        if (!isFirstLoadRef.current) {
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
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Nepodařilo se načíst žádosti.",
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [statusFilter],
  );


  useEffect(() => {
    const shouldShowLoader = isFirstLoadRef.current;

    void loadRequests(page, { silent: !shouldShowLoader }).finally(() => {
      isFirstLoadRef.current = false;
    });
  }, [loadRequests, page]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      // Poll in background to avoid UI blinking.
      void loadRequests(page, { silent: true });
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loadRequests, page]);

  useEffect(() => {
    return () => {
      highlightTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      highlightTimeoutsRef.current = [];
    };
  }, []);

  const refreshAfterResolve = async () => {
    const nextTotalItems = Math.max(0, totalItems - 1);
    const nextTotalPages = Math.max(1, Math.ceil(nextTotalItems / PAGE_SIZE));
    const targetPage = Math.min(page, nextTotalPages);
    await loadRequests(targetPage, { silent: true });
  };

  const handleApprove = async (id: number) => {
    try {
      setWorkingId(id);
      await apiService.approveExpertRoleRequest(id, noteDraft.trim() || undefined);
      closeDetailDialog();

      try {
        await refreshAfterResolve();
      } catch {
        toast.error("Žádost byla schválena, ale seznam se nepodařilo obnovit.");
      }

      toast.success("Žádost byla schválena a role Expert přidána.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Schválení se nezdařilo.",
      );
    } finally {
      setWorkingId(null);
    }
  };

  const openDetailDialog = (item: AdminRoleRequestItem) => {
    setSelectedRequest(item);
    setNoteDraft(item.adminNote ?? "");
    setDetailDialogOpen(true);
  };

  const closeDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedRequest(null);
    setNoteDraft("");
  };

  const handleReject = async (id: number) => {
    if (!selectedRequest) {
      return;
    }

    try {
      setWorkingId(id);
      await apiService.rejectExpertRoleRequest(id, noteDraft.trim() || undefined);
      closeDetailDialog();

      try {
        await refreshAfterResolve();
      } catch {
        toast.error("Žádost byla zamítnuta, ale seznam se nepodařilo obnovit.");
      }

      toast.success("Žádost byla zamítnuta.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Zamítnutí se nezdařilo.",
      );
    } finally {
      setWorkingId(null);
    }
  };

  const handleInlineNoteSave = async () => {
    if (!selectedRequest) {
      return;
    }

    try {
      setWorkingId(selectedRequest.id);
      const normalizedNote = noteDraft.trim() || undefined;
      await apiService.updateExpertRoleRequestNote(selectedRequest.id, normalizedNote);
      closeDetailDialog();

      try {
        await loadRequests(page, { silent: true });
      } catch {
        toast.error("Poznámka byla uložena, ale seznam se nepodařilo obnovit.");
      }

      toast.success("Poznámka byla uložena.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Uložení poznámky se nezdařilo.",
      );
    } finally {
      setWorkingId(null);
    }
  };

  const pageStart = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(page * PAGE_SIZE, totalItems);

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


  const handleStatusFilterChange = (value: RoleRequestFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <Card
      id="expert-role-requests"
      className={className ?? "overflow-hidden border-border/70 bg-card shadow-sm"}
    >
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="md:mr-auto">
            <CardTitle className="text-2xl font-bold">Žádosti o roli Expert</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Kliknutím na řádek zobrazíte detail žádosti, schválení a poznámky.
            </p>
          </div>

          <div className="flex w-full justify-end md:w-auto">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="request-status-filter" className="text-sm text-muted-foreground">
                Stav:
              </label>
              <select
                id="request-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  handleStatusFilterChange(event.target.value as RoleRequestFilter)
                }
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Všechny stavy</option>
                <option value="pending">Čeká</option>
                <option value="approved">Schváleno</option>
                <option value="rejected">Zamítnuto</option>
              </select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Uživatel
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    E-mail
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Požádáno
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Stav
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Vyřízeno
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Načítám žádosti...
                      </span>
                    </td>
                  </tr>
                )}

                {!loading && items.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      {statusFilter === "pending"
                        ? "Aktuálně nejsou žádné čekající žádosti."
                        : statusFilter === "approved"
                          ? "Aktuálně nejsou žádné schválené žádosti."
                          : statusFilter === "rejected"
                            ? "Aktuálně nejsou žádné zamítnuté žádosti."
                            : "Aktuálně nejsou žádné žádosti."}
                    </td>
                  </tr>
                )}

                {items.map((item) => (
                  <tr
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Otevřít detail žádosti uživatele ${item.userName}`}
                    className={`border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-muted/20 focus:outline-none focus-visible:bg-muted/35 ${
                      recentlyUpdatedIds.includes(item.id) ? "bg-primary/10" : ""
                    }`}
                    onClick={() => openDetailDialog(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openDetailDialog(item);
                      }
                    }}
                  >
                    <td className="px-4 py-3 font-medium">{item.userName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.email || "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(item.requestedAtUtc).toLocaleString("cs-CZ")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <Badge className={`border ${getStatusClasses(item.status)}`}>
                        {formatStatus(item.status)}
                      </Badge>
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
            Zobrazeno {pageStart}-{pageEnd} z {totalItems}
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
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
              disabled={page >= totalPages || loading}
            >
              Další
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      <Dialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setDetailDialogOpen(true);
            return;
          }

          closeDetailDialog();
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-3 pr-10">
              <DialogTitle>Detail žádosti</DialogTitle>
              {selectedRequest && (
                <Badge className={`border ${getStatusClasses(selectedRequest.status)}`}>
                  {formatStatus(selectedRequest.status)}
                </Badge>
              )}
            </div>
            <DialogDescription>
              {selectedRequest
                ? `Žádost od uživatele ${selectedRequest.userName}. Klikněte mimo dialog nebo použijte zavření.`
                : "Vyberte žádost pro zobrazení detailu."}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-border/70 bg-muted/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Uživatel</p>
                  <p className="mt-1 text-sm font-medium">{selectedRequest.userName}</p>
                </div>
                <div className="rounded-md border border-border/70 bg-muted/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">E-mail</p>
                  <p className="mt-1 text-sm font-medium">{selectedRequest.email || "-"}</p>
                </div>
                <div className="rounded-md border border-border/70 bg-muted/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Podáno</p>
                  <p className="mt-1 text-sm font-medium">{new Date(selectedRequest.requestedAtUtc).toLocaleString("cs-CZ")}</p>
                </div>
                <div className="rounded-md border border-border/70 bg-muted/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Vyřízeno</p>
                  <p className="mt-1 text-sm font-medium">
                    {selectedRequest.reviewedAtUtc
                      ? new Date(selectedRequest.reviewedAtUtc).toLocaleString("cs-CZ")
                      : "Nevyřízeno"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Poznámka uživatele</p>
                <div className="rounded-md border border-border/70 bg-muted/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Odeslaná poznámka
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {selectedRequest.userNote?.trim() ? "Vyplněno" : "Bez poznámky"}
                    </span>
                  </div>
                  <p className="mt-2 max-h-40 overflow-y-auto pr-1 text-sm leading-relaxed text-foreground whitespace-pre-wrap break-all">
                    {selectedRequest.userNote?.trim() || "Uživatel žádnou poznámku nepřidal"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Poznámka admina</p>
                <div className="rounded-md border border-border/70 bg-muted/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Aktuální poznámka
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {selectedRequest.adminNote?.trim() ? "Uložena" : "Bez poznámky"}
                    </span>
                  </div>
                  <textarea
                    id="admin-note"
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    rows={5}
                    maxLength={NOTE_MAX_LENGTH}
                    className="mt-2 max-h-40 min-h-24 w-full resize-y overflow-y-auto rounded-md border border-border/70 bg-background/40 p-3 text-sm leading-relaxed outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    placeholder="Zatím bez poznámky"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Poznámku můžete upravit přímo tady.</span>
                    <span>
                      {noteDraft.trim() === (selectedRequest.adminNote ?? "").trim()
                        ? `${noteDraft.length}/${NOTE_MAX_LENGTH}`
                        : `Neuložené změny • ${noteDraft.length}/${NOTE_MAX_LENGTH}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                {selectedRequest.status === "Pending" && (
                  <Button
                    type="button"
                    disabled={workingId === selectedRequest.id}
                    onClick={() => handleApprove(selectedRequest.id)}
                  >
                    <Check className="size-4" />
                    Schválit
                  </Button>
                )}

                {selectedRequest.status === "Pending" && (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={workingId === selectedRequest.id}
                    onClick={() => handleReject(selectedRequest.id)}
                  >
                    <X className="size-4" />
                    Zamítnout
                  </Button>
                )}


                <Button
                  type="button"
                  variant="secondary"
                  disabled={workingId === selectedRequest.id}
                  onClick={handleInlineNoteSave}
                >
                  Uložit poznámku
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

