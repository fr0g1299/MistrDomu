"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  apiService,
  ExpertForManualRead,
  ManualForExpertRead,
} from "@/lib/apiService";
import { Manual } from "@/types/manual";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck } from "lucide-react";

type ExpertOverview = {
  expertId: number;
  expertName: string;
  manuals: ManualForExpertRead[];
};

export default function AdminManualHelpManagement() {
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [expertByManual, setExpertByManual] = useState<
    Record<number, ExpertForManualRead[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedManualId, setSelectedManualId] = useState<number | null>(null);
  const [newExpertId, setNewExpertId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const allManuals = await apiService.getAllManuals();
      setManuals(allManuals);
      if (allManuals.length > 0 && selectedManualId == null) {
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
  }, []);

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
    ? expertByManual[selectedManualId] ?? []
    : [];

  const handleAssign = async () => {
    const parsedExpertId = Number(newExpertId);
    if (!selectedManualId || !Number.isInteger(parsedExpertId) || parsedExpertId <= 0) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await apiService.addManualToExpert(selectedManualId, parsedExpertId);
      setNewExpertId("");
      await loadAll();
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

  const handleRemove = async (manualId: number, expertId: number) => {
    try {
      setSaving(true);
      setError(null);
      await apiService.removeManualFromExpert(manualId, expertId);
      await loadAll();
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

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <div className="border-b border-border bg-card px-6 py-8">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <ShieldCheck className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Admin</p>
            <h1 className="text-2xl font-bold">Pomoc s návody</h1>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
            Načítám správu expertů...
          </div>
        )}

        {!loading && (
          <Tabs defaultValue="overview" className="space-y-5">
            <TabsList>
              <TabsTrigger value="overview">Mód 1: Přehled expertů</TabsTrigger>
              <TabsTrigger value="manage">Mód 2: Správa přiřazení</TabsTrigger>
            </TabsList>

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Experti a jejich návody</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {expertOverview.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Zatím není přiřazen žádný expert k žádnému návodu.
                    </p>
                  )}

                  {expertOverview.map((expert) => (
                    <div
                      key={expert.expertId}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="font-semibold">
                          {expert.expertName} <span className="text-muted-foreground">(ID: {expert.expertId})</span>
                        </p>
                        <Badge variant="secondary">{expert.manuals.length} návodů</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {expert.manuals.map((manual) => (
                          <Link
                            key={`${expert.expertId}-${manual.manualId}`}
                            to={`/guide/${manual.manualId}`}
                            className="rounded-md border border-border px-2 py-1 text-xs hover:border-primary/40"
                          >
                            {manual.manualTitle}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manage">
              <Card>
                <CardHeader>
                  <CardTitle>Přiřazování expertů k návodům</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto]">
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={selectedManualId ?? ""}
                      onChange={(event) => setSelectedManualId(Number(event.target.value))}
                    >
                      {manuals.map((manual) => (
                        <option key={manual.id} value={manual.id}>
                          {manual.title} (ID: {manual.id})
                        </option>
                      ))}
                    </select>

                    <Input
                      value={newExpertId}
                      onChange={(event) => setNewExpertId(event.target.value)}
                      placeholder="ID experta"
                      inputMode="numeric"
                    />

                    <Button type="button" onClick={handleAssign} disabled={saving}>
                      Přidat experta
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Aktuálně přiřazení experti</p>
                    {selectedManualExperts.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Pro vybraný návod zatím není žádný expert.
                      </p>
                    )}

                    {selectedManualExperts.map((expert) => (
                      <div
                        key={`${selectedManualId}-${expert.expertId}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <p className="text-sm">
                          {expert.expertName} <span className="text-muted-foreground">(ID: {expert.expertId})</span>
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={saving || !selectedManualId}
                          onClick={() =>
                            selectedManualId &&
                            handleRemove(selectedManualId, expert.expertId)
                          }
                        >
                          Odebrat
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
