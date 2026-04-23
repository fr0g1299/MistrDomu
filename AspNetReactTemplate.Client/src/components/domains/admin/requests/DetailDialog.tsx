import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminRoleRequestItem } from "@/types/roleRequest";

const NOTE_MAX_LENGTH = 500;

type DetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRequest: AdminRoleRequestItem | null;
  noteDraft: string;
  onNoteDraftChange: (value: string) => void;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
  onSaveNote: () => Promise<void>;
  workingId: number | null;
};

const formatStatus = (status: string) => {
  if (status === "Approved") return "Schváleno";
  if (status === "Rejected") return "Zamítnuto";
  return "Čeká";
};

const getStatusClasses = (status: string) => {
  if (status === "Approved") {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20";
  }

  if (status === "Rejected") {
    return "bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/20";
  }

  return "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/20";
};

export function DetailDialog({
  open,
  onOpenChange,
  selectedRequest,
  noteDraft,
  onNoteDraftChange,
  onApprove,
  onReject,
  onSaveNote,
  workingId,
}: DetailDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (newOpen) {
          onOpenChange(true);
          return;
        }

        onOpenChange(false);
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-3 pr-10">
            <DialogTitle>Detail žádosti</DialogTitle>
            {selectedRequest && (
              <Badge
                className={`border ${getStatusClasses(selectedRequest.status)}`}
              >
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
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Uživatel
                </p>
                <p className="mt-1 text-sm font-medium">
                  {selectedRequest.userName}
                </p>
              </div>
              <div className="rounded-md border border-border/70 bg-muted/10 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  E-mail
                </p>
                <p className="mt-1 text-sm font-medium">
                  {selectedRequest.email || "-"}
                </p>
              </div>
              <div className="rounded-md border border-border/70 bg-muted/10 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Podáno
                </p>
                <p className="mt-1 text-sm font-medium">
                  {new Date(selectedRequest.requestedAtUtc).toLocaleString(
                    "cs-CZ",
                  )}
                </p>
              </div>
              <div className="rounded-md border border-border/70 bg-muted/10 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Vyřízeno
                </p>
                <p className="mt-1 text-sm font-medium">
                  {selectedRequest.reviewedAtUtc
                    ? new Date(selectedRequest.reviewedAtUtc).toLocaleString(
                        "cs-CZ",
                      )
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
                    {selectedRequest.userNote?.trim()
                      ? "Vyplněno"
                      : "Bez poznámky"}
                  </span>
                </div>
                <p className="mt-2 max-h-40 overflow-y-auto pr-1 text-sm leading-relaxed text-foreground whitespace-pre-wrap break-all">
                  {selectedRequest.userNote?.trim() ||
                    "Uživatel žádnou poznámku nepřidal"}
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
                    {selectedRequest.adminNote?.trim()
                      ? "Uložena"
                      : "Bez poznámky"}
                  </span>
                </div>
                <textarea
                  id="admin-note"
                  value={noteDraft}
                  onChange={(event) => onNoteDraftChange(event.target.value)}
                  rows={5}
                  maxLength={NOTE_MAX_LENGTH}
                  className="mt-2 max-h-40 min-h-24 w-full resize-y overflow-y-auto rounded-md border border-border/70 bg-background/40 p-3 text-sm leading-relaxed outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  placeholder="Zatím bez poznámky"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Poznámku můžete upravit přímo tady.</span>
                  <span>
                    {noteDraft.trim() ===
                    (selectedRequest.adminNote ?? "").trim()
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
                  onClick={() => onApprove(selectedRequest.id)}
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
                  onClick={() => onReject(selectedRequest.id)}
                >
                  <X className="size-4" />
                  Zamítnout
                </Button>
              )}

              <Button
                type="button"
                variant="secondary"
                disabled={workingId === selectedRequest.id}
                onClick={onSaveNote}
              >
                Uložit poznámku
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
