import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import { GuideIntroduction } from "@/components/domains/guide/GuideIntroduction";
import { GuideSteps } from "@/components/domains/guide/GuideSteps";
import { GuideTableOfContents } from "@/components/domains/guide/GuideTableOfContents";
import { apiService } from "@/lib/apiService";

import { Manual, GuideStep, TableOfContentsItem } from "@/types/manual";
import { Separator } from "@/components/ui/separator";

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
    id: index + 1,
  }));
};

export default function Guide() {
  const { manualId } = useParams<{ manualId: string }>();
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
    setCompletedStepIds(
      new Set(
        steps.filter((step) => step.initiallyCompleted).map((step) => step.id),
      ),
    );
  }, [steps]);

  const handleToggleStep = useCallback((stepId: number) => {
    setCompletedStepIds((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }, []);

  const handleResetCompletedSteps = useCallback(() => {
    setCompletedStepIds(new Set());
  }, []);

  const handleScrollTo = useCallback((sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setActiveSectionId(sectionId);
  }, []);

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
      <GuideIntroduction manual={manual} tools={manualTools} />
      <Separator className="mb-8 bg-linear-to-r from-background to-primary/50" />

      <main
        className="mx-auto w-full xl:max-w-[95vw] 2xl:max-w-[85vw] px-4 pb-20 sm:px-6"
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
          <GuideSteps
            steps={steps}
            completedStepIds={completedStepIds}
            onToggleStep={handleToggleStep}
          />

          <GuideTableOfContents
            manualId={Number(manualId)}
            tableOfContents={tableOfContents}
            steps={steps}
            completedStepIds={completedStepIds}
            activeSectionId={activeSectionId}
            onScrollTo={handleScrollTo}
            onResetCompletedSteps={handleResetCompletedSteps}
          />
        </div>
      </main>
    </div>
  );
}
