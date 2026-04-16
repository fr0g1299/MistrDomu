import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Send } from "lucide-react";
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
};

export default function MyRoleRequestCreate({ open = true, onOpenChange }: MyRoleRequestCreateProps) {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeCreate = () => {
    if (onOpenChange) {
      onOpenChange(false);
      setDescription("");
      return;
    }

    navigate("/my-requests", { replace: true });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await apiService.createRoleRequest({
        requestType: "Expert",
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
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (onOpenChange) {
        onOpenChange(isOpen);
        if (!isOpen) {
          setDescription("");
        }
      }
    }}>
      <DialogContent className="max-w-3xl overflow-hidden border-border/70 bg-card p-0 shadow-xl">
        <DialogHeader className="border-b border-border px-6 py-5 text-left sm:text-left">
          <DialogTitle className="text-2xl font-bold">Vytvořit žádost o roli Expert</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Vyplň krátké odůvodnění a odešli žádost ke schválení administrátorem.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-6">
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
              Zrušit
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

