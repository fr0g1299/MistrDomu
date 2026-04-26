import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  apiService,
  ExpertForManualRead,
  ManualForExpertRead,
} from "@/lib/apiService";
import type { AdminUserRow } from "@/types/adminUser";
import { Manual } from "@/types/manual";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Loader2,
  Search,
  UserPlus,
  PlusCircle,
  Trash2,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

type ExpertOverview = {
  expertId: number;
  expertName: string;
  manuals: ManualForExpertRead[];
};

const normalizeForSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

type PendingAdminAction =
  | {
      type: "add";
      manualId: number;
      manualTitle: string;
      expertId: number;
      expertName: string;
    }
  | {
      type: "remove";
      manualId: number;
      manualTitle: string;
      expertId: number;
      expertName: string;
    };

const getExpertDisplayName = (expert: AdminUserRow) => {
  const parts = [expert.firstName, expert.lastName].filter(Boolean);
  return parts.length > 0
    ? parts.join(" ")
    : (expert.username ?? `Expert #${expert.id}`);
};

const getPluralText = (count: number) => {
  const rule = new Intl.PluralRules("cs-CZ").select(count);

  const mapping = {
    one: { manual: "manuál", showAllLabel: "další" },
    few: { manual: "manuály", showAllLabel: "další" },
    other: { manual: "manuálů", showAllLabel: "dalších" },
  };

  return mapping[rule as keyof typeof mapping] || mapping.other;
};

export default function AdminExpertAssignment() {
  const [searchParams] = useSearchParams();
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [experts, setExperts] = useState<AdminUserRow[]>([]);
  const [expertByManual, setExpertByManual] = useState<
    Record<number, ExpertForManualRead[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedManualId, setSelectedManualId] = useState<number | null>(null);
  const [selectedExpertId, setSelectedExpertId] = useState<string>("");
  const [overviewSearch, setOverviewSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAdminAction | null>(
    null,
  );
  const [infoPopupMessage, setInfoPopupMessage] = useState<string | null>(null);
  const [showAllManualsForExpertsIds, setShowallManualsForExpertsIds] =
    useState<number[]>([]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [allManuals, expertUsers] = await Promise.all([
        apiService.getAllManuals(),
        apiService.getUsers({
          role: "Expert",
          sortBy: "lastName",
          sortDirection: "asc",
          page: 1,
          pageSize: 100,
        }),
      ]);

      setManuals(allManuals);
      setExperts(expertUsers.items);

      const manualIdFromUrl = searchParams.get("manualId");

      if (manualIdFromUrl) {
        const manualIdNum = parseInt(manualIdFromUrl, 10);
        if (
          !isNaN(manualIdNum) &&
          allManuals.some((m) => m.id === manualIdNum)
        ) {
          setSelectedManualId(manualIdNum);
        } else if (allManuals.length > 0) {
          setSelectedManualId(allManuals[0].id);
        }
      } else if (allManuals.length > 0 && selectedManualId == null) {
        setSelectedManualId(allManuals[0].id);
      }

      const pairs = await Promise.all(
        allManuals.map(async (manual) => {
          try {
            const experts = await apiService.getExpertsForManual(manual.id);
            return [manual.id, experts] as const;
          } catch {
            return [manual.id, []] as const;
          }
        }),
      );

      setExpertByManual(Object.fromEntries(pairs));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nepodařilo se načíst data pro správu expertů.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const expertOverview = useMemo<ExpertOverview[]>(() => {
    const map = new Map<number, ExpertOverview>();

    for (const manual of manuals) {
      const experts = expertByManual[manual.id] ?? [];
      for (const expert of experts) {
        const existing = map.get(expert.expertId);
        const manualInfo: ManualForExpertRead = {
          manualId: manual.id,
          manualTitle: manual.title,
        };

        if (existing) {
          existing.manuals.push(manualInfo);
        } else {
          map.set(expert.expertId, {
            expertId: expert.expertId,
            expertName: expert.expertName,
            manuals: [manualInfo],
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.expertName.localeCompare(b.expertName),
    );
  }, [manuals, expertByManual]);

  const selectedManualExperts = selectedManualId
    ? (expertByManual[selectedManualId] ?? [])
    : [];

  const selectedManualObj = manuals.find((m) => m.id === selectedManualId);

  const filteredExpertOverview = useMemo(() => {
    const needle = normalizeForSearch(overviewSearch.trim());
    if (!needle) {
      return expertOverview;
    }

    return expertOverview.filter((expert) => {
      const matchesId = expert.expertId.toString().includes(needle);
      const matchesName = normalizeForSearch(expert.expertName).includes(
        needle,
      );
      const matchesManual = expert.manuals.some((manual) =>
        normalizeForSearch(manual.manualTitle).includes(needle),
      );

      return matchesId || matchesName || matchesManual;
    });
  }, [expertOverview, overviewSearch]);

  const assignExpert = async (manualId: number, expertId: number) => {
    try {
      setSaving(true);
      setError(null);
      await apiService.addManualToExpert(manualId, expertId);
      setSelectedExpertId("");
      await loadAll();
      toast.success(
        `Expert ${pendingAction?.expertName} byl přiřazen k návodu.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nepodařilo se přiřadit experta k návodu.",
      );
    } finally {
      setSaving(false);
    }
  };

  const removeExpert = async (manualId: number, expertId: number) => {
    try {
      setSaving(true);
      setError(null);
      await apiService.removeManualFromExpert(manualId, expertId);
      await loadAll();
      toast.success(
        `Expert ${pendingAction?.expertName} byl odebrán z návodu.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nepodařilo se odebrat experta z návodu.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openAddPopup = () => {
    const parsedExpertId = Number(selectedExpertId);
    if (
      !selectedManualId ||
      !Number.isInteger(parsedExpertId) ||
      parsedExpertId <= 0
    ) {
      setInfoPopupMessage("Nejprve vyberte experta ze seznamu.");
      return;
    }

    const selectedManual = manuals.find(
      (manual) => manual.id === selectedManualId,
    );
    const selectedExpert = experts.find(
      (expert) => expert.id === parsedExpertId,
    );
    setPendingAction({
      type: "add",
      manualId: selectedManualId,
      manualTitle: selectedManual?.title ?? `Návod ID ${selectedManualId}`,
      expertId: parsedExpertId,
      expertName: selectedExpert
        ? getExpertDisplayName(selectedExpert)
        : `Expert #${parsedExpertId}`,
    });
  };

  const openRemovePopup = (
    manualId: number,
    expertId: number,
    expertName: string,
  ) => {
    const selectedManual = manuals.find((manual) => manual.id === manualId);
    setPendingAction({
      type: "remove",
      manualId,
      manualTitle: selectedManual?.title ?? `Návod ID ${manualId}`,
      expertId,
      expertName,
    });
  };

  const handleConfirmPendingAction = async () => {
    if (!pendingAction) return;

    if (pendingAction.type === "add") {
      await assignExpert(pendingAction.manualId, pendingAction.expertId);
    } else {
      await removeExpert(pendingAction.manualId, pendingAction.expertId);
    }

    setPendingAction(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <main className="mx-auto w-[95%] xl:w-[90%] 2xl:w-[80%] px-6 py-8">
        <h1 className="text-2xl font-bold mt-2 mb-10">
          Přiřazení expertů k návodům
        </h1>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
            Načítám správu expertů...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
            {/* LEFT COLUMN: Manage Assignments */}
            <div className="space-y-6">
              {/* Add Expert Card */}
              <Card className="bg-card border-zinc-800 shadow-none">
                <CardHeader className="flex items-center justify-center pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Přiřadit nového experta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Vybrat Návod
                    </label>
                    <Combobox items={manuals}>
                      <ComboboxInput
                        placeholder={`${selectedManualId ? manuals.find((m) => m.id === selectedManualId)?.title : "Vyberte návod..."}`}
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>Žádné návody nenalezeny.</ComboboxEmpty>
                        <ComboboxList>
                          {(manual) => (
                            <ComboboxItem
                              key={manual.id}
                              value={manual.title + " (ID: " + manual.id + ")"}
                              onClick={() => {
                                setSelectedManualId(manual.id);
                              }}
                            >
                              {manual.title} (ID: {manual.id})
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Vybrat Experta
                    </label>
                    <Combobox items={experts}>
                      <ComboboxInput placeholder="Vyberte experta..." />
                      <ComboboxContent>
                        <ComboboxEmpty>Žádní experti nenalezeni.</ComboboxEmpty>
                        <ComboboxList>
                          {(expert) => (
                            <ComboboxItem
                              key={expert.id}
                              value={
                                getExpertDisplayName(expert) +
                                " (ID: " +
                                expert.id +
                                ")"
                              }
                              onClick={() => {
                                setSelectedExpertId(expert.id);
                              }}
                              disabled={
                                expert.id ===
                                selectedManualExperts.find(
                                  (e) => e.expertId === expert.id,
                                )?.expertId
                              }
                            >
                              {getExpertDisplayName(expert)} (ID: {expert.id})
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>

                  <Button
                    type="button"
                    onClick={openAddPopup}
                    className="w-full bg-primary text-black hover:bg-primary/85 h-11 text-base font-semibold"
                    disabled={saving || experts.length === 0}
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Přidat experta
                  </Button>
                </CardContent>
              </Card>

              {/* Currently Assigned Experts Card */}
              <Card className="bg-card border-zinc-800 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    Aktuálně přiřazení experti
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground border-b border-zinc-700 pb-3">
                    Pro návod:{" "}
                    <span className="font-medium">
                      #{selectedManualId} - {selectedManualObj?.title}
                    </span>
                  </p>

                  {selectedManualExperts.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">
                      Pro vybraný návod zatím není žádný expert.
                    </p>
                  )}

                  <div className="space-y-3">
                    {selectedManualExperts.map((expert) => (
                      <div
                        key={`${selectedManualId}-${expert.expertId}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-popover p-4"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {expert.expertName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            ID: {expert.expertId}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-red-900/50 text-red-400 hover:bg-red-950/50 hover:text-red-300"
                          disabled={saving || !selectedManualId}
                          onClick={() =>
                            selectedManualId &&
                            openRemovePopup(
                              selectedManualId,
                              expert.expertId,
                              expert.expertName,
                            )
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Odebrat
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: Expert Overview & Search */}
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={overviewSearch}
                  onChange={(event) => setOverviewSearch(event.target.value)}
                  placeholder="Hledat podle ID, jména nebo názvu návodu..."
                  className="h-14 pl-12 border-zinc-800 text-base shadow-sm focus-visible:ring-1 focus-visible:ring-zinc-500"
                />
              </div>

              {/* Expert Grid */}
              {expertOverview.length === 0 && (
                <p className="text-sm text-muted-foreground pt-4">
                  Zatím není přiřazen žádný expert k žádnému návodu.
                </p>
              )}

              {expertOverview.length > 0 &&
                filteredExpertOverview.length === 0 && (
                  <p className="text-sm text-muted-foreground pt-4">
                    Pro zadané hledání nebyl nalezen žádný expert.
                  </p>
                )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredExpertOverview.map((expert) => {
                  const maxVisible = 2;
                  const visibleManuals = expert.manuals.slice(0, maxVisible);
                  const hiddenCount = expert.manuals.length - maxVisible;

                  return (
                    <Card
                      key={expert.expertId}
                      className="bg-card border-zinc-800 shadow-none"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="text-xl font-semibold">
                            {expert.expertName}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="bg-zinc-800 text-muted-foreground hover:bg-zinc-800/70"
                          >
                            {expert.manuals.length}{" "}
                            {getPluralText(expert.manuals.length).manual}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          ID: {expert.expertId}
                        </p>

                        <div className="border-t border-zinc-700 pt-4">
                          <p className="text-xs text-muted-foreground mb-3">
                            Přiřazené návody:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {/* Visible Manuals (2) */}
                            {visibleManuals.map((manual) => (
                              <Badge
                                key={`${expert.expertId}-${manual.manualId}`}
                                className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs text-primary hover:bg-primary/20 transition-colors max-w-55 cursor-pointer"
                                onClick={() => {
                                  setSelectedManualId(manual.manualId);
                                }}
                              >
                                <BookOpen className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">
                                  {manual.manualTitle}
                                </span>
                              </Badge>
                            ))}
                            {/* Show All Manuals */}
                            {showAllManualsForExpertsIds.includes(
                              expert.expertId,
                            ) && (
                              <>
                                {expert.manuals
                                  .slice(maxVisible)
                                  .map((manual) => (
                                    <Badge
                                      key={`${expert.expertId}-${manual.manualId}`}
                                      className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs text-primary hover:bg-primary/20 transition-colors max-w-55 cursor-pointer"
                                      onClick={() => {
                                        setSelectedManualId(manual.manualId);
                                      }}
                                    >
                                      <BookOpen className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate">
                                        {manual.manualTitle}
                                      </span>
                                    </Badge>
                                  ))}
                              </>
                            )}
                            {/* Toggle Button */}
                            {hiddenCount > 0 && (
                              <Badge
                                variant="outline"
                                className="border-zinc-700 bg-zinc-800 hover:bg-zinc-800/70 text-muted-foreground font-normal cursor-pointer"
                                onClick={() => {
                                  if (
                                    showAllManualsForExpertsIds.includes(
                                      expert.expertId,
                                    )
                                  ) {
                                    setShowallManualsForExpertsIds((prev) =>
                                      prev.filter(
                                        (id) => id !== expert.expertId,
                                      ),
                                    );
                                  } else {
                                    setShowallManualsForExpertsIds((prev) => [
                                      ...prev,
                                      expert.expertId,
                                    ]);
                                  }
                                }}
                              >
                                {!showAllManualsForExpertsIds.includes(
                                  expert.expertId,
                                ) && hiddenCount > 0
                                  ? `+${hiddenCount}
                                ${getPluralText(hiddenCount).showAllLabel}`
                                  : "Skrýt"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Popups */}
      <Dialog
        open={Boolean(infoPopupMessage)}
        onOpenChange={() => setInfoPopupMessage(null)}
      >
        <DialogContent className="bg-card border-zinc-700">
          <DialogHeader>
            <DialogTitle>Informace</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {infoPopupMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setInfoPopupMessage(null)}
              className="bg-primary text-black hover:bg-primary/90"
            >
              Rozumím
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingAction)}
        onOpenChange={() => setPendingAction(null)}
      >
        <DialogContent className="bg-card border-zinc-800">
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.type === "add"
                ? "Potvrdit přidání experta"
                : "Potvrdit odebrání experta"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {pendingAction?.type === "add"
                ? `Chcete přiřadit experta ${pendingAction?.expertName} (ID: ${pendingAction?.expertId}) k návodu ${pendingAction?.manualTitle}?`
                : `Chcete odebrat experta ${pendingAction?.expertName} (ID: ${pendingAction?.expertId}) z návodu ${pendingAction?.manualTitle}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              className="border-zinc-700 bg-zinc-800 hover:bg-zinc-800/70"
              variant="outline"
              onClick={() => setPendingAction(null)}
            >
              Zrušit
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              onClick={handleConfirmPendingAction}
              disabled={saving}
            >
              {pendingAction?.type === "add"
                ? "Potvrdit přidání"
                : "Potvrdit odebrání"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
