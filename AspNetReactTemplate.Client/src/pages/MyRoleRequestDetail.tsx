import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { apiService } from "@/lib/apiService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserRoleRequestDetail } from "@/types/roleRequest";

const formatStatus = (status: string) => {
  if (status === "Approved") return "Schváleno";
  if (status === "Rejected") return "Zamítnuto";
  return "Čeká";
};

const getStatusClasses = (status: string) => {
  if (status === "Approved")
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (status === "Rejected")
    return "bg-red-500/15 text-red-300 border-red-500/30";
  return "bg-amber-500/15 text-amber-300 border-amber-500/30";
};

const formatType = (type: string) => {
  if (type === "Expert") return "Role Expert";
  return type;
};

export default function MyRoleRequestDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestId } = useParams();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<UserRoleRequestDetail | null>(null);

  const isBackgroundModal = Boolean(
    (location.state as { backgroundLocation?: unknown } | null)
      ?.backgroundLocation,
  );

  const closeDetail = () => {
    if (isBackgroundModal) {
      navigate(-1);
      return;
    }

    navigate("/my-requests", { replace: true });
  };

  useEffect(() => {
    const id = Number(requestId);
    if (!id) {
      closeDetail();
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const data = await apiService.getMyRoleRequestDetail(id);
        setDetail(data);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Detail žádosti se nepodařilo načíst.",
        );
        closeDetail();
      } finally {
        setLoading(false);
      }
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  return (
    <Dialog open onOpenChange={(open) => !open && closeDetail()}>
      <DialogContent className="max-w-4xl overflow-hidden border-border/70 bg-card p-0 shadow-xl">
        <DialogHeader className="border-b border-border px-6 py-5 text-left sm:text-left">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
            <div>
              <DialogTitle className="text-2xl font-bold">
                Detail žádosti
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Přehled podané žádosti a všech poznámek v režimu pouze pro
                čtení.
              </DialogDescription>
            </div>

            {!loading && detail && (
              <Badge className={`border ${getStatusClasses(detail.status)}`}>
                {formatStatus(detail.status)}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {loading && (
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Načítám detail...
            </div>
          )}

          {!loading && detail && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-border/70 bg-muted/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    ID žádosti
                  </p>
                  <p className="mt-1 text-sm font-medium">#{detail.id}</p>
                </div>
                <div className="rounded-md border border-border/70 bg-muted/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Typ
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {formatType(detail.requestType)}
                  </p>
                </div>
                <div className="rounded-md border border-border/70 bg-muted/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Podáno
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {new Date(detail.requestedAtUtc).toLocaleString("cs-CZ")}
                  </p>
                </div>
                <div className="rounded-md border border-border/70 bg-muted/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Vyřízeno
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {detail.reviewedAtUtc
                      ? new Date(detail.reviewedAtUtc).toLocaleString("cs-CZ")
                      : "Nevyřízeno"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Můj popis</p>
                <div className="rounded-md border border-border/70 bg-muted/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Odeslaná poznámka
                  </p>
                  <p className="mt-2 max-h-40 overflow-y-auto pr-1 text-sm leading-relaxed text-foreground whitespace-pre-wrap break-all">
                    {detail.description?.trim() ||
                      "Uživatel žádný popis nepřidal"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Poznámka admina</p>
                <div className="rounded-md border border-border/70 bg-muted/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Aktuální poznámka
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {detail.adminNote?.trim() ? "Vyplněno" : "Bez poznámky"}
                    </span>
                  </div>
                  <p className="mt-2 max-h-40 overflow-y-auto pr-1 text-sm leading-relaxed text-foreground whitespace-pre-wrap break-all">
                    {detail.adminNote?.trim() || "Zatím bez poznámky"}
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={closeDetail}>
              <ArrowLeft className="size-4" />
              Zpět na žádosti
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
