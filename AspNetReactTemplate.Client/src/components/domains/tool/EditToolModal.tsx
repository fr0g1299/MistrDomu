import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Tool } from "@/types/tool";

type EditToolModalProps = {
  isOpen: boolean;
  tool: Tool | null;
  onClose: () => void;
  onSave: (updatedTool: Tool) => Promise<void>;
};

export function EditToolModal({
  isOpen,
  tool,
  onClose,
  onSave,
}: EditToolModalProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tool) {
      setName(tool.name);
      setUrl(tool.url || "");
      setError(null);
    }
  }, [tool, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Název nástroje je povinný");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        id: tool!.id,
        name: name.trim(),
        url: url.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Chyba při ukládání nástroje"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upravit nástroj</DialogTitle>
          <DialogDescription>
            Upravte název a URL nástroje. Klikněte na Uložit, až budete hotovi.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Název *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Název nástroje"
              disabled={isSaving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              type="url"
              disabled={isSaving}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Zrušit
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ukládám...
              </>
            ) : (
              "Uložit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
