import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiService, type PendingManualCallRead } from "@/lib/apiService";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, Loader2, PhoneCall, PhoneIncoming, PhoneOff } from "lucide-react";

export default function ExpertStandbyPage() {
  const navigate = useNavigate();
  const { user, isExpert } = useAuth();
  const userId = user?.id;
  const [waiting, setWaiting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignedManuals, setAssignedManuals] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingCall, setPendingCall] = useState<PendingManualCallRead | null>(null);
  const [waitingStartedAtMs, setWaitingStartedAtMs] = useState<number | null>(null);
  const [sessionWaitingSeconds, setSessionWaitingSeconds] = useState(0);

  const formatElapsed = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
    }

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!userId || !isExpert) {
      setAssignedManuals([]);
      setAssignmentsLoading(false);
      return;
    }

    let cancelled = false;

    const loadAssignments = async () => {
      try {
        setAssignmentsLoading(true);
        const manuals = await apiService.getManualsForExpert(userId);

        if (!cancelled) {
          setAssignedManuals(manuals.map((manual) => manual.manualTitle));
        }
      } catch (err) {
        if (!cancelled) {
          setAssignedManuals([]);
          setError(err instanceof Error ? err.message : "Nepodařilo se načíst přiřazené návody.");
        }
      } finally {
        if (!cancelled) {
          setAssignmentsLoading(false);
        }
      }
    };

    void loadAssignments();

    return () => {
      cancelled = true;
    };
  }, [userId, isExpert]);

  const canWait = isExpert && assignedManuals.length > 0;

  useEffect(() => {
    if (!userId || !isExpert) {
      setWaiting(false);
      setWaitingStartedAtMs(null);
      setSessionWaitingSeconds(0);
      return;
    }

    let cancelled = false;

    const loadWaitingStatus = async () => {
      try {
        const status = await apiService.getExpertWaitingStatus();
        if (cancelled) {
          return;
        }

        if (status.isWaiting && status.waitingSinceUtc) {
          const startedAtMs = Date.parse(status.waitingSinceUtc);
          if (!Number.isNaN(startedAtMs)) {
            setWaiting(true);
            setWaitingStartedAtMs(startedAtMs);
            setSessionWaitingSeconds(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));
          }
        }
      } catch {
        // no-op
      }
    };

    void loadWaitingStatus();

    return () => {
      cancelled = true;
    };
  }, [userId, isExpert]);

  useEffect(() => {
    if (!waiting || !waitingStartedAtMs) {
      return;
    }

    const timer = window.setInterval(() => {
      setSessionWaitingSeconds(Math.max(0, Math.floor((Date.now() - waitingStartedAtMs) / 1000)));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [waiting, waitingStartedAtMs]);

  // Start waiting
  const handleStartWaiting = async () => {
    if (!isExpert) {
      setError("Tato stránka je určená pouze pro experty.");
      return;
    }

    if (assignedManuals.length === 0) {
      setError("Nemáte přiřazený žádný návod, u kterého byste mohl čekat na hovor.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiService.setExpertWaiting(true);
      const startedAt = Date.now();
      setWaiting(true);
      setWaitingStartedAtMs(startedAt);
      setSessionWaitingSeconds(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Neznámá chyba";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Stop waiting
  const handleStopWaiting = async () => {
    try {
      setLoading(true);
      setError(null);
      await apiService.setExpertWaiting(false);
      setWaiting(false);
      setWaitingStartedAtMs(null);
      setSessionWaitingSeconds(0);
      setPendingCall(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Neznámá chyba";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Join call
  const handleJoinCall = (call: PendingManualCallRead) => {
    const popup = window.open(call.roomUrl, "daily_call", "width=800,height=600");
    if (!popup) {
      setError("Prohlížeč zablokoval otevření hovoru. Povolte pop-up okna.");
      return;
    }

    const startedAt = Date.now();
    const intervalId = window.setInterval(async () => {
      if (!popup.closed) {
        return;
      }

      window.clearInterval(intervalId);

      const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      try {
        await apiService.logManualCallDuration({
          manualId: call.manualId,
          counterpartyUserId: call.callerUserId,
          roomName: call.roomName,
          durationSeconds,
        });
      } catch (err) {
        console.error("Call duration logging failed:", err);
      }
    }, 1000);

    setPendingCall(null);
  };

  // Heartbeat timer (every 10 seconds to keep expert alive)
  useEffect(() => {
    if (!waiting) return;

    const heartbeatInterval = setInterval(async () => {
      try {
        await apiService.sendExpertWaitingHeartbeat();
      } catch (err) {
        console.error("Heartbeat failed:", err);
      }
    }, 10000);

    return () => clearInterval(heartbeatInterval);
  }, [waiting]);

  // Polling for incoming calls (every 3 seconds)
  useEffect(() => {
    if (!waiting) return;

    const pollInterval = setInterval(async () => {
      try {
        const call = await apiService.getNextWaitingCall();
        if (call) {
          setPendingCall(call);
        }
      } catch (err) {
        console.error("Poll failed:", err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [waiting]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground px-4 py-12">
        <Card className="mx-auto w-full max-w-lg rounded-2xl border border-border/70 bg-card/95 p-6 shadow-sm">
          <h1 className="mb-3 text-xl font-bold">Nejste přihlášeni</h1>
          <p className="mb-4 text-sm text-muted-foreground">Pro přístup na tuto stránku se prosím přihlaste.</p>
          <Button onClick={() => navigate("/login")}>Přihlášení</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Card className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="border-b border-border bg-muted/30 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold sm:text-2xl">Čekání na hovor</h1>
                <p className="text-sm text-muted-foreground">
                  Dostupnost platí pro všechny návody, na kterých jste přiřazeni jako expert.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 py-6">

            {!isExpert && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Tato stránka je určená jen pro experty.
              </div>
            )}

            {isExpert && (
              <div className="rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                {assignmentsLoading
                  ? "Načítám vaše přiřazené návody..."
                  : assignedManuals.length > 0
                    ? `Máte přiřazeno ${assignedManuals.length} návodů. Čekání platí pro všechny z nich.`
                    : "Nemáte zatím přiřazený žádný návod, takže zde nelze začít čekat na hovor."}
              </div>
            )}

            {error && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {!waiting ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Po spuštění čekání vás uvidí studenti na příslušných návodech jako dostupného experta.
                </p>
                <Button
                  onClick={handleStartWaiting}
                  disabled={loading || !canWait || assignmentsLoading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Načítám...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <PhoneCall className="h-4 w-4" />
                      Začít čekat na hovor
                    </span>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {!pendingCall ? (
                  <div className="rounded-xl border border-primary/25 bg-muted/40 px-4 py-5 text-center">
                    <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <p className="text-lg font-semibold text-foreground">Jste dostupný pro hovor</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Čekáme na příchozí spojení od studenta.
                    </p>
                    <p className="mt-2 text-sm font-medium text-primary">
                      Aktuální čekání: {formatElapsed(sessionWaitingSeconds)}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                    <div className="mb-3 flex items-center gap-2 text-primary">
                      <PhoneIncoming className="h-4 w-4" />
                      <h2 className="text-base font-bold">Příchozí hovor</h2>
                    </div>
                    <p className="mb-1 text-sm text-foreground">
                      <strong>Od:</strong> {pendingCall.callerDisplayName || "Nový student"}
                    </p>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Typ: Žádost o pomoc
                      <br />
                      Návod: {pendingCall.manualTitle}
                    </p>
                    <Button
                      onClick={() => handleJoinCall(pendingCall)}
                      className="w-full"
                      size="lg"
                    >
                      <PhoneIncoming className="mr-2 h-4 w-4" />
                      Připojit se k hovoru
                    </Button>
                  </div>
                )}

                <Button
                  onClick={handleStopWaiting}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Načítám...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <PhoneOff className="h-4 w-4" />
                      Přestat čekat
                    </span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
