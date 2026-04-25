import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { apiService } from "@/lib/apiService";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UserRoleRequestDetail } from "@/types/roleRequest";
import { useAuth } from "@/hooks/useAuth";

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
  const { isAdmin, isExpert } = useAuth();

  const [detail, setDetail] = useState<UserRoleRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async () => {
      if (isAdmin || isExpert) {
        navigate("/", { replace: true });
        return;
      }

      try {
        setLoading(true);

        const latestRequest = await apiService.getMyExpertRoleRequest();
        if (!latestRequest) {
          navigate("/my-requests/new", { replace: true });
          return;
        }

        const requestDetail = await apiService.getMyRoleRequestDetail(
          latestRequest.id,
        );
        setDetail(requestDetail);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Nepodařilo se načíst žádosti.",
        );
        navigate("/", { replace: true });
      }

      setLoading(false);
    },
    [isAdmin, isExpert, navigate],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handleUserUpdate = () => {
      void load();
    };

    window.addEventListener("role-request-user-updated", handleUserUpdate);
    return () =>
      window.removeEventListener("role-request-user-updated", handleUserUpdate);
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground antialiased">
        <main className="mx-auto max-w-5xl px-6 py-8">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Načítám detail...
          </div>
        </main>
      </div>
    );
  }

  if (!detail) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Žádost o roli Expert</CardTitle>
              <CardDescription className="mt-1 text-sm text-muted-foreground">
                Přehled podané žádosti a všech poznámek.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 border-t border-border/70 pt-6">
            <div className="flex justify-start">
              <Badge className={`border ${getStatusClasses(detail.status)}`}>
                {formatStatus(detail.status)}
              </Badge>
            </div>

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
              <p className="text-sm font-semibold">Poznámka administrátora</p>
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
