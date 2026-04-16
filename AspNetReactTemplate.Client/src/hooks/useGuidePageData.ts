import { useCallback, useEffect, useState } from "react";

import { apiService } from "@/lib/apiService";
import type { GuideStep, Manual, TableOfContentsItem } from "@/types/manual";

type ToolRead = { id: number; name: string; url?: string };

type UseGuidePageDataParams = {
  manualId?: string;
  manualFromState?: Manual | null;
};

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
];

// ! Mapper for aligning backend step IDs with local sequence (1, 2, 3...) for consistent UI display and tracking.
// ! May do harm in the future for adding completed steps to user's profile
const mapStepsToLocalSequence = (steps: GuideStep[]): GuideStep[] => {
  return steps.map((step, index) => ({
    ...step,
    dbId: step.dbId ?? step.id,
    id: index + 1,
  }));
};

export function useGuidePageData({
  manualId,
  manualFromState,
}: UseGuidePageDataParams) {
  const [manual, setManual] = useState<Manual | null>(manualFromState ?? null);
  const [manualLoading, setManualLoading] = useState(
    !manualFromState && Boolean(manualId),
  );
  const [manualError, setManualError] = useState<string | null>(null);
  const [steps, setSteps] = useState<GuideStep[]>([]);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [stepsError, setStepsError] = useState<string | null>(null);
  const [manualTools, setManualTools] = useState<ToolRead[]>([]);
  const [completedStepIds, setCompletedStepIds] = useState<Set<number>>(
    () => new Set(),
  );

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

  // Load completed steps from the server once steps are available
  useEffect(() => {
    const parsedManualId = Number(manualId);
    if (
      steps.length === 0 ||
      !Number.isInteger(parsedManualId) ||
      parsedManualId <= 0
    ) {
      return;
    }

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
        // silently ignore - local state stays empty
      }
    };

    fetchCompleted();
    return () => {
      isCancelled = true;
    };
  }, [steps, manualId]);

  const toggleCompletedStep = useCallback(
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

      const parsedManualId = Number(manualId);
      if (!Number.isInteger(parsedManualId) || parsedManualId <= 0) {
        return;
      }

      // Persist to server using the real DB step ID
      const step = steps.find((s) => s.id === stepId);
      if (step) {
        const dbStepId = step.dbId ?? step.id;
        apiService
          .toggleCompletedStep(parsedManualId, dbStepId)
          .catch(console.error);
      }
    },
    [steps, manualId],
  );

  const resetCompletedSteps = useCallback(() => {
    setCompletedStepIds(new Set());

    const parsedManualId = Number(manualId);
    if (!Number.isInteger(parsedManualId) || parsedManualId <= 0) {
      return;
    }

    apiService.resetCompletedSteps(parsedManualId).catch(console.error);
  }, [manualId]);

  return {
    manual,
    manualLoading,
    manualError,
    tableOfContents,
    steps,
    stepsLoading,
    stepsError,
    manualTools,
    completedStepIds,
    toggleCompletedStep,
    resetCompletedSteps,
  };
}
