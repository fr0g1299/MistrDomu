import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import type { RoleRequestType } from "@/types/roleRequest";

export default function MyRoleRequestCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [requestType, setRequestType] = useState<RoleRequestType>("Expert");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBackgroundModal = Boolean(
    (location.state as { backgroundLocation?: unknown } | null)?.backgroundLocation,
  );

  const closeCreate = () => {
    if (isBackgroundModal) {
      navigate(-1);
      return;
    }

    navigate("/my-requests", { replace: true });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await apiService.createRoleRequest({
        requestType,
        description: description.trim() || undefined,
      });

      toast.success("Žádost byla odeslána.");
      closeCreate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Odeslání žádosti selhalo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && closeCreate()}>
      <DialogContent className="max-w-3xl overflow-hidden border-border/70 bg-card p-0 shadow-xl">
        <DialogHeader className="border-b border-border px-6 py-5 text-left sm:text-left">
          <DialogTitle className="text-2xl font-bold">Přidat žádost</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Vyplň krátké odůvodnění a odešli žádost ke schválení adminem.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-6">
          <div className="grid gap-2 md:max-w-sm">
            <label htmlFor="request-type" className="text-sm font-medium text-foreground">
              Typ žádosti
            </label>
            <select
              id="request-type"
              value={requestType}
              onChange={(event) => setRequestType(event.target.value as RoleRequestType)}
              style={{ colorScheme: "dark" }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <option value="Expert">Role Expert</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Popis (volitelně)
            </label>
            <textarea
              id="description"
              maxLength={500}
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              placeholder="Napiš, proč o roli žádáš."
            />
            <div className="text-right text-xs text-muted-foreground">{description.length}/500</div>
          </div>

          <DialogFooter className="border-t border-border pt-4 sm:justify-between">
            <Button type="button" variant="outline" onClick={closeCreate}>
              <ArrowLeft className="size-4" />
              Zpět na výpis žádostí
            </Button>

            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Odeslat žádost
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

