"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/lib/apiService";
import { Manual, getDifficultyLabel } from "@/types/manual";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Check,
  Loader2,
  Search,
  SquareCheckBig,
  SquareDashed,
} from "lucide-react";

type VisibilityFilter = "all" | "selected" | "unselected";

type PendingExpertAction = {
  manualId: number;
  manualTitle: string;
  isRemoving: boolean;
};

export default function ManualHelpManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>("all");
  const [selectedManualIds, setSelectedManualIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [savingManualId, setSavingManualId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] =
    useState<PendingExpertAction | null>(null);

  const fetchData = async () => {
    if (!user?.id) {
      setError("Nepodařilo se načíst ID přihlášeného uživatele.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [allManuals, myManuals] = await Promise.all([
        apiService.getAllManuals(),
        apiService.getManualsForExpert(user.id),
      ]);

      setManuals(allManuals);
      setSelectedManualIds(new Set(myManuals.map((manual) => manual.manualId)));
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nepodařilo se načíst návody.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const filteredManuals = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return manuals.filter((manual) => {
      const searchableText = [
        manual.title,
        manual.description,
        ...(manual.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      const isSelected = selectedManualIds.has(manual.id);
      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "selected" && isSelected) ||
        (visibilityFilter === "unselected" && !isSelected);

      return matchesSearch && matchesVisibility;
    });
  }, [manuals, searchTerm, selectedManualIds, visibilityFilter]);

  const toggleManual = async (manualId: number) => {
    if (!user?.id) {
      setError("Nepodařilo se načíst ID přihlášeného uživatele.");
      return;
    }

    const wasSelected = selectedManualIds.has(manualId);

    setSavingManualId(manualId);
    setError(null);
    try {
      if (wasSelected) {
        await apiService.removeManualFromExpert(manualId, user.id);
      } else {
        await apiService.addManualToExpert(manualId, user.id);
      }

      setSelectedManualIds((current) => {
        const next = new Set(current);
        if (wasSelected) {
          next.delete(manualId);
        } else {
          next.add(manualId);
        }
        return next;
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nepodařilo se změnit přiřazení pomocníka.",
      );
    } finally {
      setSavingManualId(null);
    }
  };

  const openTogglePopup = (manual: Manual) => {
    const isRemoving = selectedManualIds.has(manual.id);
    setPendingAction({
      manualId: manual.id,
      manualTitle: manual.title,
      isRemoving,
    });
  };

  const confirmToggleAction = async () => {
    if (!pendingAction) return;
    await toggleManual(pendingAction.manualId);
    setPendingAction(null);
  };

  const selectedCount = selectedManualIds.size;
  const totalCount = manuals.length;

  const pageTitle = "Správa mých návodů";
  const pageDescription =
    "Zde vidíte návody, ve kterých jste zapsaní jako pomocník. Můžete se přidávat do nových i odebírat z existujících.";

  const shortenDescription = (text: string): string => {
    if (text.length <= 250) {
      return text;
    }

    return `${text.slice(0, 250).trimEnd()}...`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Page Header */}
      <div className="border-b border-border bg-card px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
              <SquareCheckBig className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Expert
              </p>
              <h1 className="text-2xl font-bold">{pageTitle}</h1>
            </div>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {pageDescription}
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <Card className="shadow-sm">
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex-1 space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Vyhledávání
                </label>
                <div className="relative max-w-xl">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Hledat podle názvu, popisu nebo tagů"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={visibilityFilter === "all" ? "default" : "outline"}
                  onClick={() => setVisibilityFilter("all")}
                >
                  Vše
                </Button>
                <Button
                  type="button"
                  variant={
                    visibilityFilter === "selected" ? "default" : "outline"
                  }
                  onClick={() => setVisibilityFilter("selected")}
                >
                  Jen vybrané
                </Button>
                <Button
                  type="button"
                  variant={
                    visibilityFilter === "unselected" ? "default" : "outline"
                  }
                  onClick={() => setVisibilityFilter("unselected")}
                >
                  Jen nevybrané
                </Button>
              </div>
            </div>

            {/* Statistics bar with reduced padding */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">Celkem: {totalCount}</Badge>
                <Badge variant="secondary">
                  Zobrazeno: {filteredManuals.length}
                </Badge>
                <Badge variant="secondary">
                  Jsem pomocník: {selectedCount}
                </Badge>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
                Načítám návody...
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {!loading && !error && filteredManuals.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
                <SquareDashed className="size-10 opacity-40" />
                <div>
                  <p className="text-base font-medium text-foreground">
                    Žádné návody neodpovídají aktuálnímu filtru.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Zkuste upravit hledání nebo přepnout zobrazení na všechny
                    návody.
                  </p>
                </div>
              </div>
            )}

            {!loading && !error && filteredManuals.length > 0 && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {filteredManuals.map((manual) => {
                  const isSelected = selectedManualIds.has(manual.id);
                  const isSaving = savingManualId === manual.id;

                  return (
                    <div
                      key={manual.id}
                      className={`group rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                        isSelected
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-card hover:border-primary/25"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input bg-background"
                          }`}
                          aria-hidden="true"
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="truncate text-base font-semibold">
                              {manual.title}
                            </h3>
                            {isSelected && (
                              <Badge className="shrink-0" variant="default">
                                Vybráno
                              </Badge>
                            )}
                          </div>

                          <p className="line-clamp-3 text-sm text-muted-foreground">
                            {shortenDescription(manual.description)}
                          </p>

                          <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                            <Badge variant="secondary">
                              {getDifficultyLabel(manual.difficulty)}
                            </Badge>
                            <Badge variant="secondary">
                              {manual.estimatedTimeMinutes} min
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              onClick={() => openTogglePopup(manual)}
                              disabled={isSaving}
                            >
                              {isSaving
                                ? "Ukládám..."
                                : isSelected
                                  ? "Odebrat se z návodu"
                                  : "Přidat se do návodu"}
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => navigate(`/guide/${manual.id}`)}
                            >
                              Navštívit návod
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog
        open={Boolean(pendingAction)}
        onOpenChange={() => setPendingAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.isRemoving
                ? "Potvrdit odepsání z návodu"
                : "Potvrdit zapsání do návodu"}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.isRemoving
                ? `Opravdu se chcete odepsat z návodu ${pendingAction.manualTitle}?`
                : `Opravdu se chcete zapsat jako pomocník do návodu ${pendingAction?.manualTitle}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingAction(null)}
            >
              Zrušit
            </Button>
            <Button
              type="button"
              onClick={confirmToggleAction}
              disabled={savingManualId !== null}
            >
              {pendingAction?.isRemoving ? "Ano, odepsat" : "Ano, zapsat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
