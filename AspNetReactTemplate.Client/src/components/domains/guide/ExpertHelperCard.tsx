"use client";

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, PhoneCall, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { apiService, AvailableExpertRead } from "@/lib/apiService";

type ExpertHelperCardProps = {
  manualId: string | undefined;
};

export function ExpertHelperCard({ manualId }: ExpertHelperCardProps) {
  const { user, isExpert, loading } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;
  const showExpertCard = !loading && isExpert;
  const showCallCard = !loading && Boolean(userId) && !isExpert;

  const [helperEnrollLoading, setHelperEnrollLoading] = useState(false);
  const [helperStatusLoading, setHelperStatusLoading] = useState(false);
  const [helperAlreadyEnrolled, setHelperAlreadyEnrolled] = useState(false);
  const [availableExperts, setAvailableExperts] = useState<
    AvailableExpertRead[]
  >([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [callLoading, setCallLoading] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

  useEffect(() => {
    const parsedManualId = Number(manualId);
    if (
      !userId ||
      !isExpert ||
      !Number.isInteger(parsedManualId) ||
      parsedManualId <= 0
    ) {
      setHelperAlreadyEnrolled(false);
      setHelperStatusLoading(false);
      return;
    }

    let isCancelled = false;

    const fetchHelperStatus = async () => {
      setHelperStatusLoading(true);

      try {
        const manuals = await apiService.getManualsForExpert(userId);
        if (isCancelled) return;

        setHelperAlreadyEnrolled(
          manuals.some((manual) => manual.manualId === parsedManualId),
        );
      } catch {
        if (!isCancelled) {
          setHelperAlreadyEnrolled(false);
        }
      } finally {
        if (!isCancelled) {
          setHelperStatusLoading(false);
        }
      }
    };

    fetchHelperStatus();

    return () => {
      isCancelled = true;
    };
  }, [manualId, userId, isExpert]);

  useEffect(() => {
    const parsedManualId = Number(manualId);

    if (
      !showCallCard ||
      !Number.isInteger(parsedManualId) ||
      parsedManualId <= 0
    ) {
      setAvailableExperts([]);
      setAvailabilityLoading(false);
      return;
    }

    let isCancelled = false;

    const loadAvailability = async () => {
      if (!isCancelled) {
        setAvailabilityLoading(true);
      }

      try {
        const experts =
          await apiService.getAvailableExpertsForManual(parsedManualId);
        if (isCancelled) return;
        setAvailableExperts(experts);
      } catch {
        if (!isCancelled) {
          setAvailableExperts([]);
        }
      } finally {
        if (!isCancelled) {
          setAvailabilityLoading(false);
        }
      }
    };

    void loadAvailability();
    const intervalId = window.setInterval(() => {
      void loadAvailability();
    }, 10000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [manualId, showCallCard]);

  const handleStartCall = useCallback(async () => {
    const parsedManualId = Number(manualId);

    if (!Number.isInteger(parsedManualId) || parsedManualId <= 0) {
      return;
    }

    setCallLoading(true);
    setCallError(null);

    try {
      const call = await apiService.startManualCall(parsedManualId);
      const popup = window.open(
        call.roomUrl,
        "daily_call",
        "width=1000,height=700",
      );

      if (!popup) {
        setCallError(
          "Prohlížeč zablokoval otevření hovoru. Povolte pop-up okna.",
        );
        return;
      }

      const startedAt = Date.now();
      const intervalId = window.setInterval(async () => {
        if (!popup.closed) {
          return;
        }

        window.clearInterval(intervalId);

        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - startedAt) / 1000),
        );
        try {
          await apiService.logManualCallDuration({
            manualId: parsedManualId,
            counterpartyUserId: call.expertId,
            roomName: call.roomName,
            durationSeconds,
          });
        } catch (err) {
          console.error("Call duration logging failed:", err);
        }
      }, 1000);
    } catch (err: unknown) {
      setCallError(
        err instanceof Error ? err.message : "Nepodařilo se zahájit hovor.",
      );
    } finally {
      setCallLoading(false);
    }
  }, [manualId]);

  const handleToggleHelperEnrollment = useCallback(async () => {
    const parsedManualId = Number(manualId);
    if (!Number.isInteger(parsedManualId) || parsedManualId <= 0) {
      return;
    }

    if (!userId) {
      toast.error("Nepodařilo se určit vaše uživatelské ID.");
      return;
    }

    setHelperEnrollLoading(true);

    try {
      if (helperAlreadyEnrolled) {
        await apiService.removeManualFromExpert(parsedManualId, userId);
        setHelperAlreadyEnrolled(false);
        toast.success("Byli jste odhlášeni jako pomocník pro tento návod.");
      } else {
        await apiService.registerAsManualHelper(parsedManualId, userId);
        setHelperAlreadyEnrolled(true);
        toast.success("Byli jste zapsáni jako pomocník pro tento návod.");
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : helperAlreadyEnrolled
            ? "Nepodařilo se odhlásit jako pomocník."
            : "Nepodařilo se zapsat jako pomocník.",
      );
    } finally {
      setHelperEnrollLoading(false);
    }
  }, [manualId, userId, helperAlreadyEnrolled]);

  if (!showExpertCard && !showCallCard) {
    return null;
  }

  return showExpertCard ? (
    <Card className="mb-6 py-4 gap-3">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold">Expert pomocník</CardTitle>
          <CardDescription>
            Pokud chcete pomáhat s tímto návodem, zapište se jako pomocník.
          </CardDescription>
        </div>
        <Button
          type="button"
          onClick={handleToggleHelperEnrollment}
          disabled={helperEnrollLoading || helperStatusLoading}
          variant={helperAlreadyEnrolled ? "secondary" : "default"}
        >
          {helperStatusLoading ? (
            "Kontroluji stav..."
          ) : helperAlreadyEnrolled ? (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Odhlásit se jako pomocník
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Zapsat se jako pomocník
            </span>
          )}
        </Button>
      </CardHeader>

      {helperAlreadyEnrolled && (
        <CardContent>
          {/* TODO: Check css of this div */}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="link"
              className="h-auto px-0 text-sm cursor-pointer"
              onClick={() => navigate("/manual-help-management")}
            >
              Přejít do správy mých návodů
            </Button>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => navigate("/expert-standby")}
            >
              Čekat na hovory
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  ) : (
    <Card className="mb-6 py-4 gap-3">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold">
            Telefonická pomoc s návodem
          </CardTitle>
          <CardDescription>
            Tlačítko se zobrazí jen pokud je právě dostupný odborník přiřazený k
            tomuto návodu.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {availableExperts.length > 0 ? (
          <Button
            type="button"
            onClick={handleStartCall}
            disabled={callLoading}
          >
            <PhoneCall className="mr-2 h-4 w-4" />
            {callLoading
              ? "Vytvářím hovor..."
              : `Zavolat odborníkovi (${availableExperts[0].expertName})`}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            {availabilityLoading
              ? "Kontroluji dostupnost odborníků..."
              : "Aktuálně není dostupný žádný expert ani student."}
          </p>
        )}
        {callError && (
          <p className="mt-3 text-sm text-destructive">{callError}</p>
        )}
      </CardContent>
    </Card>
  );
}
