import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  AdminDataTable,
  AdminTableCard,
  AdminTableHead,
  AdminTablePagination,
  AdminTableStateRow,
  PAGE_SIZE,
  type AdminTableColumn,
} from "@/components/domains/admin/TableLayout";
import { DetailDialog } from "@/components/domains/admin/requests/DetailDialog";
import { apiService } from "@/lib/apiService";
import type {
  AdminRoleRequestItem,
  RoleRequestFilter,
} from "@/types/roleRequest";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

const EXPERT_ROLE_REQUEST_COLUMNS: AdminTableColumn[] = [
  { key: "user", label: "Uživatel" },
  { key: "email", label: "E-mail" },
  { key: "requested-at", label: "Požádáno" },
  { key: "status", label: "Stav" },
  { key: "reviewed-at", label: "Vyřízeno" },
  {
    key: "actions",
    label: <span className="font-bold">Akce</span>,
    className: "text-right pr-5",
  },
];

export default function AdminExpertRoleRequests() {
  const [items, setItems] = useState<AdminRoleRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RoleRequestFilter>("all");
  const isFirstLoadRef = useRef(true);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<AdminRoleRequestItem | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
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
      highlightTimeoutsRef.current.forEach((timeoutId) =>
        window.clearTimeout(timeoutId),
      );
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
      await apiService.approveExpertRoleRequest(
        id,
        noteDraft.trim() || undefined,
      );
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
      await apiService.rejectExpertRoleRequest(
        id,
        noteDraft.trim() || undefined,
      );
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
      await apiService.updateExpertRoleRequestNote(
        selectedRequest.id,
        normalizedNote,
      );
      closeDetailDialog();

      try {
        await loadRequests(page, { silent: true });
      } catch {
        toast.error("Poznámka byla uložena, ale seznam se nepodařilo obnovit.");
      }

      toast.success("Poznámka byla uložena.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Uložení poznámky se nezdařilo.",
      );
    } finally {
      setWorkingId(null);
    }
  };

  const handleStatusFilterChange = (value: RoleRequestFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  // TODO: This can be exported to DetailDialog, now it's duplicated
  const getStatusClasses = (status: string) => {
    if (status === "Approved") {
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20";
    }

    if (status === "Rejected") {
      return "bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/20";
    }

    return "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/20";
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <main className="mx-auto w-[95%] xl:w-[90%] 2xl:w-[80%] px-6 py-8">
        <AdminTableCard
          id="expert-role-requests"
          title="Žádosti o roli Expert"
          description="Kliknutím na řádek zobrazíte detail žádosti, schválení a poznámky."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="request-status-filter"
                className="text-sm text-muted-foreground"
              >
                Stav:
              </label>
              <select
                id="request-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  handleStatusFilterChange(
                    event.target.value as RoleRequestFilter,
                  )
                }
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Všechny stavy</option>
                <option value="pending">Čeká</option>
                <option value="approved">Schváleno</option>
                <option value="rejected">Zamítnuto</option>
              </select>
            </div>
          }
        >
          <AdminDataTable>
            <AdminTableHead columns={EXPERT_ROLE_REQUEST_COLUMNS} />
            <tbody>
              {loading && (
                <AdminTableStateRow
                  colSpan={5}
                  message="Načítám žádosti..."
                  loading
                />
              )}

              {!loading && items.length === 0 && (
                <AdminTableStateRow
                  colSpan={5}
                  message={
                    statusFilter === "pending"
                      ? "Aktuálně nejsou žádné čekající žádosti."
                      : statusFilter === "approved"
                        ? "Aktuálně nejsou žádné schválené žádosti."
                        : statusFilter === "rejected"
                          ? "Aktuálně nejsou žádné zamítnuté žádosti."
                          : "Aktuálně nejsou žádné žádosti."
                  }
                />
              )}

              {items.map((item, idx) => (
                <tr
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Otevřít detail žádosti uživatele ${item.userName}`}
                  className={`cursor-pointer border-b border-border transition-colors hover:bg-muted/20 last:border-0 focus:outline-none focus-visible:bg-muted/35 ${
                    idx % 2 === 0 ? "" : "bg-muted/10"
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
                    <Badge
                      variant="outline"
                      className={getStatusClasses(item.status)}
                    >
                      {item.status === "Approved"
                        ? "Schváleno"
                        : item.status === "Rejected"
                          ? "Zamítnuto"
                          : "Čeká"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.reviewedAtUtc
                      ? new Date(item.reviewedAtUtc).toLocaleString("cs-CZ")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetailDialog(item)}
                    >
                      <Edit2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminDataTable>

          <AdminTablePagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
            disabled={loading}
          />

          <DetailDialog
            open={detailDialogOpen}
            onOpenChange={(open) => {
              if (open) {
                setDetailDialogOpen(true);
                return;
              }
              closeDetailDialog();
            }}
            selectedRequest={selectedRequest}
            noteDraft={noteDraft}
            onNoteDraftChange={setNoteDraft}
            onApprove={handleApprove}
            onReject={handleReject}
            onSaveNote={handleInlineNoteSave}
            workingId={workingId}
          />
        </AdminTableCard>
      </main>
    </div>
  );
}
