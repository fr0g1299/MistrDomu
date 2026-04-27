import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Coins,
  Loader2,
  Wallet,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Using the custom Dialog components provided
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  apiService,
  type ExpertWithdrawalRead,
  type ExpertManualCallDetailRead,
  type ManualForExpertRead,
} from "@/lib/apiService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type ManualCallsForDashboard = {
  manualId: number;
  manualTitle: string;
  callsCount: number;
  calls: ExpertManualCallDetailRead["calls"];
};

const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }

  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }

  return `${secs}s`;
};

const formatDateTime = (utcIso: string) => {
  return new Date(utcIso).toLocaleString("cs-CZ", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export default function ExpertDashboardPage() {
  const navigate = useNavigate();
  const { user, isExpert } = useAuth();
  const expertId = user?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manuals, setManuals] = useState<ManualForExpertRead[]>([]);
  const [totalCalls, setTotalCalls] = useState(0);
  const [totalOnlineSeconds, setTotalOnlineSeconds] = useState(0);
  const [expertBalanceCzk, setExpertBalanceCzk] = useState(0);
  const [manualCallRows, setManualCallRows] = useState<ManualCallsForDashboard[]>([]);
  const [callBreakdownOpen, setCallBreakdownOpen] = useState(false);
  const [expandedManualIds, setExpandedManualIds] = useState<Set<number>>(new Set());
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [withdrawHistoryLoading, setWithdrawHistoryLoading] = useState(false);
  const [withdrawHistoryOpen, setWithdrawHistoryOpen] = useState(false);
  const [withdrawals, setWithdrawals] = useState<ExpertWithdrawalRead[]>([]);

  useEffect(() => {
    if (!expertId || !isExpert) {
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const [assignedManuals, callsCount, onlineSeconds, callDetails, earningsCzk, withdrawalHistory] =
          await Promise.all([
            apiService.getManualsForExpert(expertId),
            apiService.getTotalCallsByExpert(expertId),
            apiService.getTotalOnlineSecondsByExpert(expertId),
            apiService.getManualCallDetailsByExpert(expertId),
            apiService.getTotalEarningsCzkByExpert(expertId),
            apiService.getExpertWithdrawalHistory(),
          ]);

        if (isCancelled) {
          return;
        }

        const detailByManualId = new Map<number, ExpertManualCallDetailRead>(
          callDetails.map((detail) => [detail.manualId, detail]),
        );

        const mergedRows = assignedManuals
          .map<ManualCallsForDashboard>((manual) => {
            const detail = detailByManualId.get(manual.manualId);
            return {
              manualId: manual.manualId,
              manualTitle: manual.manualTitle,
              callsCount: detail?.callsCount ?? 0,
              calls: detail?.calls ?? [],
            };
          })
          .sort((a, b) => {
            if (b.callsCount !== a.callsCount) {
              return b.callsCount - a.callsCount;
            }

            return a.manualTitle.localeCompare(b.manualTitle, "cs");
          });

        setManuals(assignedManuals);
        setTotalCalls(callsCount);
        setTotalOnlineSeconds(onlineSeconds);
        setExpertBalanceCzk(earningsCzk);
        setManualCallRows(mergedRows);
        setWithdrawals(withdrawalHistory);
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Nepodařilo se načíst dashboard experta.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isCancelled = true;
    };
  }, [expertId, isExpert]);

  const toggleManualExpanded = (manualId: number) => {
    setExpandedManualIds((current) => {
      const next = new Set(current);
      if (next.has(manualId)) {
        next.delete(manualId);
      } else {
        next.add(manualId);
      }
      return next;
    });
  };

  const loadWithdrawalHistory = async () => {
    setWithdrawHistoryLoading(true);
    try {
      const rows = await apiService.getExpertWithdrawalHistory();
      setWithdrawals(rows);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nepodařilo se načíst historii výběrů.");
    } finally {
      setWithdrawHistoryLoading(false);
    }
  };

  const handleWithdrawAll = () => {
    if (expertBalanceCzk <= 0) {
      toast.error("Nemáte žádné prostředky k výběru.");
      return;
    }

    setWithdrawConfirmOpen(true);
  };

  const confirmWithdrawAll = async () => {
    setWithdrawLoading(true);
    try {
      const result = await apiService.withdrawExpertBalance();
      setExpertBalanceCzk(result.newBalanceCzk);
      setWithdrawals((current) => [result.withdrawal, ...current]);
      setWithdrawConfirmOpen(false);
      toast.success("Výběr byl úspěšně vytvořen.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nepodařilo se vybrat peníze.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const openWithdrawalHistory = () => {
    setWithdrawHistoryOpen(true);
    void loadWithdrawalHistory();
  };

  const totalWithdrawnCzk = withdrawals.reduce(
    (sum, withdrawal) => sum + withdrawal.amountCzk,
    0,
  );
  const totalEarnedAllTimeCzk = expertBalanceCzk + totalWithdrawnCzk;
  const totalWithdrawalsCount = withdrawals.length;

  if (!isExpert) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Tato stránka je dostupná pouze expertům.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Přehled experta</h1>
          <p className="text-sm text-muted-foreground">
            Statistiky výkonu a výdělků.
          </p>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/40">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Načítám dashboard...
        </div>
      ) : (
        <>
          <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-primary/90">
                  Čas strávený online
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-5xl font-black leading-none tracking-tight text-primary sm:text-6xl">
                  {formatDuration(totalOnlineSeconds)}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Celkem stráveno v režimu čekání na hovory.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/15">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Počet hovorů
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-5xl font-black leading-none tracking-tight text-primary sm:text-6xl">
                  {totalCalls}
                </div>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => setCallBreakdownOpen(true)}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Zobrazit rozpis hovorů
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/15">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pomocník u návodů
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-5xl font-black leading-none tracking-tight text-primary sm:text-6xl">
                  {manuals.length}
                </div>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => navigate("/manual-help-management")}
                >
                  Správa mých návodů
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-primary/90">
                  Zůstatek
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-5xl font-black leading-none tracking-tight text-primary sm:text-6xl">
                  {expertBalanceCzk.toLocaleString("cs-CZ")} Kč
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button variant="outline" onClick={handleWithdrawAll} disabled={withdrawLoading || expertBalanceCzk <= 0}>
                    <Wallet className="mr-2 h-4 w-4" />
                    {withdrawLoading ? "Probíhá výběr..." : "Vybrat peníze"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/15">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Celkem vyděláno
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-5xl font-black leading-none tracking-tight text-primary sm:text-6xl">
                  {totalEarnedAllTimeCzk.toLocaleString("cs-CZ")} Kč
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Součet všech výběrů a aktuálního zůstatku.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/15">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Počet výběrů
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-5xl font-black leading-none tracking-tight text-primary sm:text-6xl">
                  {totalWithdrawalsCount}
                </div>
                <Button className="mt-4" variant="outline" onClick={openWithdrawalHistory}>
                  <Coins className="mr-2 h-4 w-4" />
                  Historie výběrů
                </Button>
              </CardContent>
            </Card>
          </div>

          <Dialog open={callBreakdownOpen} onOpenChange={setCallBreakdownOpen}>
            <DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden p-0 sm:max-w-4xl" showCloseButton={true}>
              <DialogHeader className="border-b px-6 py-4">
                <DialogTitle>Rozpis hovorů podle návodů</DialogTitle>
                <DialogDescription>
                  Každý návod lze rozbalit na konkrétní záznamy hovorů (datum, čas, délka).
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 overflow-y-auto px-6 py-4">
                {manualCallRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nemáte přiřazené žádné návody.</p>
                ) : (
                  manualCallRows.map((manual) => (
                    <div key={manual.manualId} className="rounded-md border bg-card">
                      <button
                        type="button"
                        onClick={() => toggleManualExpanded(manual.manualId)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-primary/5"
                      >
                        <span className="flex items-center gap-2">
                          {expandedManualIds.has(manual.manualId) ? (
                            <ChevronDown className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium">{manual.manualTitle}</span>
                        </span>
                        <span className="text-sm text-muted-foreground">{manual.callsCount} hovorů</span>
                      </button>

                      {expandedManualIds.has(manual.manualId) && (
                        <div className="border-t px-4 py-3">
                          {manual.calls.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Pro tento návod zatím není žádný hovor.</p>
                          ) : (
                            <ul className="space-y-2">
                              {manual.calls.map((call) => (
                                <li key={`${manual.manualId}-${call.roomName}-${call.loggedAtUtc}`} className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                                  <div className="font-medium">{formatDateTime(call.loggedAtUtc)}</div>
                                  <div className="text-muted-foreground">
                                    Délka: {formatDuration(call.durationSeconds)}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={withdrawHistoryOpen} onOpenChange={setWithdrawHistoryOpen}>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden p-0 sm:max-w-2xl" showCloseButton={true}>
              <DialogHeader className="border-b px-6 py-4">
                <DialogTitle>Historie výběrů</DialogTitle>
                <DialogDescription>
                  Přehled všech vašich výběrů.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 overflow-y-auto px-6 py-4">
                {withdrawHistoryLoading ? (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Načítám historii výběrů...
                  </div>
                ) : withdrawals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Zatím nemáte žádný výběr.</p>
                ) : (
                  <ul className="space-y-2">
                    {withdrawals.map((withdrawal) => (
                      <li key={withdrawal.id} className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                        <div className="font-medium">
                          -{withdrawal.amountCzk.toLocaleString("cs-CZ")} Kč
                        </div>
                        <div className="text-muted-foreground">
                          {formatDateTime(withdrawal.withdrawnAtUtc)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={withdrawConfirmOpen}
            onOpenChange={(open) => {
              if (!withdrawLoading) {
                setWithdrawConfirmOpen(open);
              }
            }}
          >
            <DialogContent className="max-w-xl" showCloseButton={!withdrawLoading}>
              <DialogHeader>
                <DialogTitle>Potvrdit výběr zůstatku</DialogTitle>
                <DialogDescription>
                  Opravdu chcete vybrat celý zůstatek {expertBalanceCzk.toLocaleString("cs-CZ")} Kč?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setWithdrawConfirmOpen(false)}
                  disabled={withdrawLoading}
                >
                  Zrušit
                </Button>
                <Button
                  type="button"
                  onClick={confirmWithdrawAll}
                  disabled={withdrawLoading}
                >
                  {withdrawLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Probíhá výběr...
                    </>
                  ) : (
                    "Ano, vybrat"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}