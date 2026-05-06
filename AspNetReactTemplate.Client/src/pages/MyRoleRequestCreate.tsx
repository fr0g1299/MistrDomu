import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { apiService } from "@/lib/apiService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type MyRoleRequestCreateProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showCloseButton?: boolean;
};

export default function MyRoleRequestCreate({
  open = true,
  onOpenChange,
  showCloseButton = false,
}: MyRoleRequestCreateProps) {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [hasRejectedRequest, setHasRejectedRequest] = useState(false);

  const loadEligibility = useCallback(async () => {
    setIsCheckingEligibility(true);

    try {
      const result = await apiService.getMyRoleRequests({
        page: 1,
        pageSize: 1,
        status: "rejected",
      });

      setHasRejectedRequest(result.totalItems > 0);
    } catch {
      setHasRejectedRequest(false);
    } finally {
      setIsCheckingEligibility(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadEligibility();
  }, [loadEligibility, open]);

  const closeCreate = () => {
    if (onOpenChange) {
      onOpenChange(false);
      setDescription("");
      return;
    }

    navigate("/my-requests", { replace: true });
  };

  const handleSubmit = async () => {
    if (hasRejectedRequest || isCheckingEligibility) {
      return;
    }

    try {
      setIsSubmitting(true);
      await apiService.createRoleRequest({
        requestType: "Expert",
        description: description.trim() || undefined,
      });

      toast.success("Žádost byla odeslána.");
      closeCreate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Odeslání žádosti selhalo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (onOpenChange) {
          onOpenChange(isOpen);
          if (!isOpen) {
            setDescription("");
          }
        }
      }}
    >
      <DialogContent
        showCloseButton={showCloseButton}
        className="max-w-3xl overflow-hidden border-border/70 bg-card p-0 shadow-xl selection:text-primary selection:bg-primary/5"
      >
        <DialogHeader className="border-b border-border px-6 py-5 text-left sm:text-left">
          <DialogTitle className="text-2xl font-bold">
            Vytvořit žádost o roli Expert
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Vyplň krátké odůvodnění a odešli žádost ke schválení
            administrátorem.
          </DialogDescription>
          <p className="mt-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
            Pokud bude žádost zamítnuta, další žádost o roli Expert už nebude
            možné podat.
          </p>
        </DialogHeader>

        <div className="space-y-6 p-6">
          <div className="grid gap-2">
            <label
              htmlFor="description"
              className="text-sm font-medium text-foreground"
            >
              Popis (volitelně)
            </label>
            <textarea
              id="description"
              maxLength={500}
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-28 w-full solid-scrollbar selection:bg-primary! selection:text-primary-foreground! rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              placeholder="Napiš, proč o roli žádáš."
            />
            <div className="text-right text-xs text-muted-foreground">
              {description.length}/500
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-4 sm:justify-between">
            {showCloseButton ? (
              <Button type="button" variant="outline" onClick={closeCreate}>
                Zrušit
              </Button>
            ) : (
              <Button asChild type="button" variant="outline">
                <Link to="/">
                  <ArrowLeft className="size-4" />
                  Zpět na hlavní stránku
                </Link>
              </Button>
            )}

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting || hasRejectedRequest || isCheckingEligibility
              }
              className="selection:text-black!"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isCheckingEligibility ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {hasRejectedRequest
                ? "Není možné odeslat"
                : isCheckingEligibility
                  ? "Ověřuji..."
                  : "Odeslat žádost"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
