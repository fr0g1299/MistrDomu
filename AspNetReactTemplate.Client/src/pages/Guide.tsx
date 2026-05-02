import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { Introduction } from "@/components/domains/guide/Introduction";
import { Steps } from "@/components/domains/guide/Steps";
import { TableOfContents } from "@/components/domains/guide/TableOfContents";
import { ExpertHelperCard } from "@/components/domains/guide/ExpertHelperCard";
import { useGuidePageData } from "@/hooks/useGuidePageData";

import { Manual } from "@/types/manual";
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
import { CheckCircle2 } from "lucide-react";
import NotFound from "./NotFound";
import { AiAssistantCard } from "@/components/domains/guide/AiAssistantCard";
import { useAuth } from "@/hooks/useAuth";

export default function Guide() {
  const { manualId } = useParams<{ manualId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { manual?: Manual } | null;
  const manualFromState = locationState?.manual;

  const {
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
  } = useGuidePageData({ manualId, manualFromState });
  const { loading: authLoading, isAuthenticated, isRestricted } = useAuth();

  const stepSectionIds = useMemo(
    () => steps.map((step) => `step-${step.id}`),
    [steps],
  );
  const trackedSectionIds = useMemo(
    () => ["introduction", "tools-required", ...stepSectionIds],
    [stepSectionIds],
  );

  const [activeSectionId, setActiveSectionId] =
    useState<string>("introduction");
  const [isPaymentSuccessDialogOpen, setIsPaymentSuccessDialogOpen] =
    useState(false);
  const [isExpertPaymentSuccessDialogOpen, setIsExpertPaymentSuccessDialogOpen] =
    useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const hasAiPayment = searchParams.get("payment") === "success";
    const hasExpertPayment = searchParams.get("expert_payment") === "success";

    if (!hasAiPayment && !hasExpertPayment) {
      return;
    }

    if (hasAiPayment) setIsPaymentSuccessDialogOpen(true);
    if (hasExpertPayment) setIsExpertPaymentSuccessDialogOpen(true);

    searchParams.delete("payment");
    searchParams.delete("expert_payment");

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

  if (!manualLoading && manualError) {
    return <NotFound />;
  }

  const canShowAiAssistant = !authLoading && isAuthenticated && !isRestricted;

  return (
    <div className="min-h-screen bg-background text-zinc-950 dark:text-zinc-50 antialiased">
      <Introduction manual={manual} tools={manualTools} />
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
        {stepsLoading && (
          <p className="mb-4 text-sm text-muted-foreground">
            Načítání kroků...
          </p>
        )}
        {stepsError && (
          <p className="mb-4 text-sm text-destructive">{stepsError}</p>
        )}
        <ExpertHelperCard
          manualId={manualId}
          variant="helper"
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-32 3xl:gap-6 4xl:gap-8">
          <TableOfContents
            tableOfContents={tableOfContents}
            steps={steps}
            completedStepIds={completedStepIds}
            activeSectionId={activeSectionId}
            onScrollTo={handleScrollTo}
            onResetCompletedSteps={resetCompletedSteps}
            topContent={
              <ExpertHelperCard
                manualId={manualId}
                variant="availability"
                className="mb-0"
              />
            }
          />

          <Steps
            steps={steps}
            completedStepIds={completedStepIds}
            onToggleStep={toggleCompletedStep}
          />

          {canShowAiAssistant && <AiAssistantCard manualId={Number(manualId)} />}
        </div>
      </main>

      {/* TODO: Maybe create a reusable dialog component */}
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

      <Dialog
        open={isExpertPaymentSuccessDialogOpen}
        onOpenChange={setIsExpertPaymentSuccessDialogOpen}
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
              Děkujeme! Konzultace s expertem byla zaplacena. Nyní můžete zavolat expertovi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setIsExpertPaymentSuccessDialogOpen(false)}
            >
              Pokračovat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
