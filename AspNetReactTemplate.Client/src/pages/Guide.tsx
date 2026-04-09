import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { GuideIntroduction } from "@/components/domains/guide/GuideIntroduction";
import { GuideSupportPanel } from "@/components/domains/guide/GuideSupportPanel";
import { GuideSteps } from "@/components/domains/guide/GuideSteps";
import { GuideTableOfContents } from "@/components/domains/guide/GuideTableOfContents";
import { apiService } from "@/lib/apiService";

import { Manual, GuideStep, TableOfContentsItem } from "@/types/manual";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, UserPlus, X } from "lucide-react";

type ToolRead = { id: number; name: string; url?: string };

const fallbackStep: GuideStep[] = [
  {
    id: 1,
    manualId: 1,
    title: "Postup se nemohl načíst.",
    content:
      "Zkuste prosím obnovit stránku. Pokud problém přetrvává, kontaktujte podporu.",
  },
];

const tableOfContents: TableOfContentsItem[] = [
  { id: "introduction", number: "01", label: "Úvod" },
  { id: "tools-required", number: "02", label: "Potřebné nástroje" },
  // { id: "preparation", number: "03", label: "Příprava" },
];

// ! Mapper for aligning backend step IDs with local sequence (1, 2, 3...) for consistent UI display and tracking.
// ! May do harm in the future for adding completed steps to user's profile
const mapStepsToLocalSequence = (steps: GuideStep[]): GuideStep[] => {
  return steps.map((step, index) => ({
    ...step,
    dbId: step.dbId ?? step.id, // preserve real DB id before overwriting
    id: index + 1,
  }));
};

export default function Guide() {
  const { user, isExpert, isAdmin } = useAuth();
  const { manualId } = useParams<{ manualId: string }>();
  const navigate = useNavigate();
  const userId = user?.id;
  const location = useLocation();
  const locationState = location.state as { manual?: Manual } | null;
  const manualFromState = locationState?.manual;

  const [manual, setManual] = useState<Manual | null>(manualFromState ?? null);
  const [manualLoading, setManualLoading] = useState(
    !manualFromState && Boolean(manualId),
  );
  const [manualError, setManualError] = useState<string | null>(null);
  const [steps, setSteps] = useState<GuideStep[]>([]);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [stepsError, setStepsError] = useState<string | null>(null);
  const [manualTools, setManualTools] = useState<ToolRead[]>([]);

  const stepSectionIds = useMemo(
    () => steps.map((step) => `step-${step.id}`),
    [steps],
  );
  const trackedSectionIds = useMemo(
    // () => ["introduction", "tools-required", "preparation", ...stepSectionIds],
    () => ["introduction", "tools-required", ...stepSectionIds],
    [stepSectionIds],
  );

  const [completedStepIds, setCompletedStepIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [activeSectionId, setActiveSectionId] =
    useState<string>("introduction");
  const [helperEnrollLoading, setHelperEnrollLoading] = useState(false);
  const [helperStatusLoading, setHelperStatusLoading] = useState(false);
  const [helperAlreadyEnrolled, setHelperAlreadyEnrolled] = useState(false);
  const [helperEnrollMessage, setHelperEnrollMessage] = useState<string | null>(
    null,
  );
  const [helperEnrollError, setHelperEnrollError] = useState<string | null>(
    null,
  );
  const [isPaymentSuccessDialogOpen, setIsPaymentSuccessDialogOpen] =
    useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("payment") !== "success") {
      return;
    }

    setIsPaymentSuccessDialogOpen(true);
    searchParams.delete("payment");

    navigate(
      {
        pathname: location.pathname,
        search: searchParams.toString() ? `?${searchParams.toString()}` : "",
      },
      {
        replace: true,
        state: location.state,
      },
    );
  }, [location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    if (!helperEnrollMessage) return;
    const timer = window.setTimeout(() => setHelperEnrollMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [helperEnrollMessage]);

  useEffect(() => {
    const parsedManualId = Number(manualId);
    if (!Number.isInteger(parsedManualId) || parsedManualId <= 0) {
      setManual(null);
      setManualLoading(false);
      setManualError("Neplatné ID návodu.");
      return;
    }

    if (manualFromState && manualFromState.id === parsedManualId) {
      setManual(manualFromState);
      setManualLoading(false);
      setManualError(null);
      return;
    }

    let isCancelled = false;

    const fetchManual = async () => {
      setManualLoading(true);
      setManualError(null);

      try {
        const response = await apiService.getManual(parsedManualId);
        if (isCancelled) return;
        setManual(response);
      } catch (err: unknown) {
        if (isCancelled) return;
        setManual(null);
        setManualError(
          err instanceof Error ? err.message : "Nepodařilo se načíst návod.",
        );
      } finally {
        if (!isCancelled) {
          setManualLoading(false);
        }
      }
    };

    fetchManual();

    return () => {
      isCancelled = true;
    };
  }, [manualFromState, manualId]);

  useEffect(() => {
    const parsedManualId = Number(manualId);
    if (!Number.isInteger(parsedManualId) || parsedManualId <= 0) {
      setSteps([]);
      setStepsLoading(false);
      setStepsError("Neplatné ID návodu pro kroky.");
      return;
    }

    let isCancelled = false;

    const fetchSteps = async () => {
      setStepsLoading(true);
      setStepsError(null);

      try {
        const response = await apiService.getManualSteps(parsedManualId);
        if (isCancelled) return;

        // ! Also here is the mapper
        const mappedSteps = mapStepsToLocalSequence(response);
        setSteps(mappedSteps.length > 0 ? mappedSteps : [fallbackStep[0]]);
      } catch (err: unknown) {
        if (isCancelled) return;

        setStepsError(
          err instanceof Error
            ? err.message
            : "Nepodařilo se načíst kroky návodu.",
        );
      } finally {
        if (!isCancelled) {
          setStepsLoading(false);
        }
      }
    };

    fetchSteps();

    return () => {
      isCancelled = true;
    };
  }, [manualId]);

  useEffect(() => {
    const parsedManualId = Number(manualId);
    if (!Number.isInteger(parsedManualId) || parsedManualId <= 0) {
      setManualTools([]);
      return;
    }

    let isCancelled = false;

    const fetchTools = async () => {
      try {
        const response = await apiService.getManualTools(parsedManualId);
        if (isCancelled) return;

        setManualTools(response);
      } catch {
        if (isCancelled) return;

        setManualTools([]);
      }
    };

    fetchTools();

    return () => {
      isCancelled = true;
    };
  }, [manualId]);

  useEffect(() => {
    const parsedManualId = Number(manualId);
    if (
      !userId ||
      (!isExpert && !isAdmin) ||
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
  }, [manualId, userId, isExpert, isAdmin]);

  // Load completed steps from the server once steps are available
  useEffect(() => {
    const parsedManualId = Number(manualId);
    if (steps.length === 0 || !Number.isInteger(parsedManualId) || parsedManualId <= 0) return;

    let isCancelled = false;

    const fetchCompleted = async () => {
      try {
        const dbIds = await apiService.getCompletedSteps(parsedManualId);
        if (isCancelled) return;
        // Map returned DB step IDs → local sequence IDs
        const localIds = new Set(
          steps
            .filter((step) => dbIds.includes(step.dbId ?? step.id))
            .map((step) => step.id),
        );
        setCompletedStepIds(localIds);
      } catch {
        // silently ignore — local state stays empty
      }
    };

    fetchCompleted();
    return () => {
      isCancelled = true;
    };
  }, [steps, manualId]);

  const handleToggleStep = useCallback(
    (stepId: number) => {
      setCompletedStepIds((prev) => {
        const next = new Set(prev);
        if (next.has(stepId)) {
          next.delete(stepId);
        } else {
          next.add(stepId);
        }
        return next;
      });

      // Persist to server using the real DB step ID
      const step = steps.find((s) => s.id === stepId);
      if (step) {
        const dbStepId = step.dbId ?? step.id;
        apiService
          .toggleCompletedStep(Number(manualId), dbStepId)
          .catch(console.error);
      }
    },
    [steps, manualId],
  );

  const handleResetCompletedSteps = useCallback(() => {
    setCompletedStepIds(new Set());
    apiService.resetCompletedSteps(Number(manualId)).catch(console.error);
  }, [manualId]);

  const handleScrollTo = useCallback((sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setActiveSectionId(sectionId);
  }, []);

  const handleEnrollAsHelper = useCallback(async () => {
    const parsedManualId = Number(manualId);
    if (!Number.isInteger(parsedManualId) || parsedManualId <= 0) {
      return;
    }

    if (helperAlreadyEnrolled) {
      setHelperEnrollMessage("Jste už zapsáni jako pomocník pro tento návod.");
      setHelperEnrollError(null);
      return;
    }

    if (!userId) {
      setHelperEnrollError("Nepodařilo se určit vaše uživatelské ID.");
      return;
    }

    setHelperEnrollLoading(true);
    setHelperEnrollError(null);
    setHelperEnrollMessage(null);

    try {
      await apiService.registerAsManualHelper(parsedManualId, userId);
      setHelperAlreadyEnrolled(true);
      setHelperEnrollMessage("Byli jste zapsáni jako pomocník pro tento návod.");
    } catch (err: unknown) {
      setHelperEnrollError(
        err instanceof Error
          ? err.message
          : "Nepodařilo se zapsat jako pomocník.",
      );
    } finally {
      setHelperEnrollLoading(false);
    }
  }, [manualId, userId, helperAlreadyEnrolled]);

  useEffect(() => {
    const updateActiveSection = () => {
      const offset = 140;
      let nextActive = trackedSectionIds[0];

      for (const sectionId of trackedSectionIds) {
        const section = document.getElementById(sectionId);
        if (!section) continue;

        if (section.getBoundingClientRect().top - offset <= 0) {
          nextActive = sectionId;
        } else {
          break;
        }
      }

      setActiveSectionId(nextActive);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [trackedSectionIds]);

  return (
    <div className="min-h-screen bg-background text-zinc-950 dark:text-zinc-50 antialiased">
      {helperEnrollMessage && (
        <div className="fixed bottom-4 right-4 z-100 w-full max-w-sm">
          <Alert
            variant="default"
            className="border-primary/50 bg-primary/70 text-black shadow-lg shadow-primary/20 [&_svg]:text-black"
          >
            <AlertDescription className="flex items-start justify-between gap-3 text-black!">
              <span className="whitespace-pre-line text-black!">
                {helperEnrollMessage}
              </span>
              <button
                type="button"
                onClick={() => setHelperEnrollMessage(null)}
                className="rounded-sm opacity-80 transition hover:opacity-100 text-black!"
                aria-label="Zavřít oznámení"
              >
                <X className="size-4" />
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <GuideIntroduction manual={manual} tools={manualTools} />
      <Separator className="mb-8 bg-linear-to-r from-background to-primary/50" />

      <main
        className="mx-auto w-full xl:max-w-[100vw] 2xl:max-w-[95vw] px-4 pb-20 sm:px-6"
        data-manual-id={manualId}
      >
        {/* TODO: In the future add Skeletons */}
        {manualLoading && (
          <p className="mb-4 text-sm text-muted-foreground">
            Načítání návodu...
          </p>
        )}
        {manualError && (
          <p className="mb-4 text-sm text-destructive">{manualError}</p>
        )}
        {stepsLoading && (
          <p className="mb-4 text-sm text-muted-foreground">
            Načítání kroků...
          </p>
        )}
        {stepsError && (
          <p className="mb-4 text-sm text-destructive">{stepsError}</p>
        )}
        {/* TODO: Cleanup into a component */}
        {isExpert && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Expert pomocník</p>
                <p className="text-sm text-muted-foreground">
                  Pokud chcete pomáhat s tímto návodem, zapište se jako pomocník.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleEnrollAsHelper}
                disabled={helperEnrollLoading || helperStatusLoading || helperAlreadyEnrolled}
                variant={helperAlreadyEnrolled ? "secondary" : "default"}
              >
                {helperStatusLoading ? (
                  "Kontroluji stav..."
                ) : helperAlreadyEnrolled ? (
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Jste pomocník
                  </span>
                ) : helperEnrollLoading ? (
                  "Zapisuji..."
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Zapsat se jako pomocník
                  </span>
                )}
              </Button>
            </div>
            {helperEnrollError && (
              <p className="mt-3 text-sm text-destructive">{helperEnrollError}</p>
            )}
            {isExpert && helperAlreadyEnrolled && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="link"
                  className="h-auto px-0 text-sm cursor-pointer"
                  onClick={() => navigate("/manual-help-management")}
                >
                  Přejít do správy mých návodů
                </Button>
              </div>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-32 3xl:gap-6 4xl:gap-8">
          <GuideTableOfContents
            tableOfContents={tableOfContents}
            steps={steps}
            completedStepIds={completedStepIds}
            activeSectionId={activeSectionId}
            onScrollTo={handleScrollTo}
            onResetCompletedSteps={handleResetCompletedSteps}
          />

          <GuideSteps
            steps={steps}
            completedStepIds={completedStepIds}
            onToggleStep={handleToggleStep}
          />

          <GuideSupportPanel manualId={Number(manualId)} />
        </div>
      </main>

      <Dialog
        open={isPaymentSuccessDialogOpen}
        onOpenChange={setIsPaymentSuccessDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Platba proběhla úspěšně
              </span>
            </DialogTitle>
            <DialogDescription>
              Děkujeme! Pro tento návod nyní máte odemknutý neomezený AI chat.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setIsPaymentSuccessDialogOpen(false)}
            >
              Pokračovat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
