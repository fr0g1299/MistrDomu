"use client";

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, CircleHelp, PhoneCall, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { apiService, AvailableExpertRead } from "@/lib/apiService";
import { cn } from "@/lib/utils";

type ExpertHelperCardVariant = "helper" | "availability";

type ExpertHelperCardProps = {
  manualId: string | undefined;
  variant?: ExpertHelperCardVariant;
  className?: string;
};

export function ExpertHelperCard({
  manualId,
  variant = "helper",
  className,
}: ExpertHelperCardProps) {
  const { user, isExpert, loading } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;
  const showExpertCard = variant === "helper" && !loading && isExpert;
  const showCallCard =
    variant === "availability" && !loading && Boolean(userId) && !isExpert;

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

    const loadAvailability = async (showLoading = false) => {
      if (!isCancelled && showLoading) {
        setAvailabilityLoading(true);
      }

      try {
        const experts =
          await apiService.getAvailableExpertsForManual(parsedManualId);
        if (isCancelled) return;
        setAvailableExperts(experts);
      } catch {
        // Keep the previous known state to avoid UI flicker on transient errors.
      } finally {
        if (!isCancelled && showLoading) {
          setAvailabilityLoading(false);
        }
      }
    };

    void loadAvailability(true);
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

  const handleOpenCallInfo = useCallback(() => {
    navigate("/?flow=help#volani-s-expertem");
  }, [navigate]);

  if (!showExpertCard && !showCallCard) {
    return null;
  }

  return showExpertCard ? (
    <Card className={cn("mb-6 py-4 gap-3", className)}>
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
    <Card
      className={cn(
        "relative mb-6 gap-3 border py-4",
        availableExperts.length > 0
          ? "border-primary/30 bg-primary/10"
          : "border-primary/30 bg-primary/3",
        className,
      )}
    >
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleOpenCallInfo}
              className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors text-primary/80 hover:bg-primary/15 hover:text-primary"
              aria-label="Zobrazit základní info o hovoru s expertem"
            >
              <CircleHelp className="h-4.5 w-4.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-64 wrap-break-word">
            <p className="text-sm">
              Pokud je expert online, můžete zahájit okamžitý hovor přímo z
              návodu. Kliknutím na tuto ikonu přejdete na sekci s podrobnostmi o
              volání s expertem.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {availableExperts.length > 0 && (
        <div className="mx-auto flex w-full items-center justify-center px-3">
          <p className="text-center text-sm font-medium text-primary">
            Aktivních expertů:
          </p>
        </div>
      )}
      <CardContent className="flex flex-col items-center gap-3 text-center">
        <p
          className={cn(
            "text-5xl font-black leading-none tracking-tight",
            availableExperts.length > 0 ? "text-primary" : "text-primary/70",
          )}
        >
          {availableExperts.length}
        </p>
        {availableExperts.length <= 0 && (
          <p className="max-w-sm text-sm font-medium text-muted-foreground">
            Momentálně pro tento návod není aktivní žádný expert.
          </p>
        )}
        {availabilityLoading && (
          <p className="text-xs text-muted-foreground">
            Kontroluji dostupnost expertů...
          </p>
        )}
        {availableExperts.length > 0 && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  onClick={handleStartCall}
                  disabled={callLoading}
                  className="w-full"
                >
                  <PhoneCall className="mr-2 h-4 w-4" />
                  {callLoading ? "Vytvářím hovor..." : "Zavolat expertovi"}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-64 wrap-break-word">
                <p className="text-sm">
                  Před voláním můžete kliknutím na ikonu otazníku zjistit více
                  informací o volání s expertem.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {callError && (
          <p className="mt-3 text-sm text-destructive">{callError}</p>
        )}
      </CardContent>
    </Card>
  );
}
