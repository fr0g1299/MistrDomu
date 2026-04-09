import { CheckCircle2, RotateCcw, Video } from "lucide-react";

import { GuideAiAssistantCard } from "@/components/domains/guide/GuideAiAssistantCard";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { GuideStep, TableOfContentsItem } from "@/types/manual";

type GuideTableOfContentsProps = {
  tableOfContents: TableOfContentsItem[];
  steps: GuideStep[];
  completedStepIds: Set<number>;
  activeSectionId: string;
  onScrollTo: (sectionId: string) => void;
  onResetCompletedSteps: () => void;
  manualId: number;
};

export function GuideTableOfContents({
  tableOfContents,
  steps,
  completedStepIds,
  activeSectionId,
  onScrollTo,
  onResetCompletedSteps,
  manualId,
}: GuideTableOfContentsProps) {
  return (
    <aside className="hidden h-fit max-h-[90vh] flex-col gap-4 lg:sticky lg:top-24 lg:col-span-1 lg:flex">
      {/* TODO: Update link */}
      <Link to="/todo" className="w-full">
        <Button
          type="button"
          aria-label="Potřebujete pomoc? Zavolat odborníkovi přes videohovor"
          className="w-full rounded-lg border border-primary/30 bg-primary/10 py-10 flex-col gap-1 font-semibold hover:bg-primary/6 transition-colors duration-200"
        >
          <span className="text-lg text-primary-600 items-center justify-center gap-2 flex">
            <Video className="size-5" /> Potřebujete pomoc?
          </span>
          <p className="text-sm text-muted-foreground">
            Zavolat odborníkovi přes videohovor
          </p>
        </Button>
      </Link>
      <Card className="gap-4 border-border bg-card p-5">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
            Průvodce opravou
          </p>
          <h2 className="text-xl font-bold">Obsah</h2>
        </div>

        <nav className="space-y-1">
          {tableOfContents.map((item) => (
            <button
              key={item.number}
              type="button"
              onClick={() => onScrollTo(item.id)}
              className={
                activeSectionId === item.id
                  ? "flex items-center gap-3 rounded-md border-l-2 border-primary bg-primary/10 px-3 py-2 transition-colors duration-300"
                  : "flex items-center gap-3 rounded-md px-3 py-2 hover:bg-zinc-300 dark:hover:bg-zinc-800 transition-colors duration-300"
              }
            >
              <span
                className={
                  activeSectionId === item.id
                    ? "text-xs font-black text-primary transition-colors duration-300"
                    : "text-xs font-black text-zinc-800 dark:text-zinc-500 transition-colors duration-300"
                }
              >
                {item.number}
              </span>
              <span
                className={
                  activeSectionId === item.id
                    ? "text-sm font-medium text-primary transition-colors duration-300"
                    : "text-sm font-medium text-zinc-700 dark:text-zinc-400 transition-colors duration-300"
                }
              >
                {item.label}
              </span>
            </button>
          ))}

          <Separator className="my-3 bg-zinc-400 dark:bg-zinc-800" />

          {steps.map((step) => {
            const stepSectionId = `step-${step.id}`;
            const isCompleted = completedStepIds.has(step.id);
            const isActive = activeSectionId === stepSectionId;

            return (
              <button
                key={`toc-step-${step.id}`}
                type="button"
                onClick={() => onScrollTo(stepSectionId)}
                className={`flex items-center justify-between w-full rounded-md border-l-2 px-3 py-3 transition-colors duration-300
                ${
                  isActive
                    ? "border-primary bg-primary/10"
                    : isCompleted
                      ? "border-transparent bg-zinc-300/50 dark:bg-zinc-800/50 opacity-80"
                      : "border-transparent hover:bg-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex gap-3 min-w-0 items-center">
                  <span
                    className={
                      isActive || isCompleted
                        ? "shrink-0 w-6 text-xs font-black text-primary-600 transition-colors duration-300"
                        : "shrink-0 w-6 text-xs font-black text-zinc-800 dark:text-zinc-500 transition-colors duration-300"
                    }
                  >
                    {step.id}
                  </span>

                  <span
                    className={
                      isActive
                        ? "min-w-0 text-sm text-primary text-left line-clamp-2 transition-colors duration-300"
                        : isCompleted
                          ? "min-w-0 text-sm text-primary-600 text-left line-through line-clamp-2 transition-colors duration-300"
                          : "min-w-0 text-sm text-zinc-700 dark:text-zinc-400 text-left line-clamp-2 transition-colors duration-300"
                    }
                  >
                    {step.title}
                  </span>
                </div>

                <div className="flex shrink-0 ml-3">
                  {isCompleted && (
                    <CheckCircle2 className="size-4 text-primary-600" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* <Button
          type="button"
          onClick={() => window.print()}
          className="mt-3 h-11 gap-2 text-sm font-bold"
        >
          <Printer className="size-4" />
          Vytisknout průvodce
        </Button> */}

        <Button
          type="button"
          variant="outline"
          onClick={onResetCompletedSteps}
          disabled={completedStepIds.size === 0}
          className="h-10 gap-2 text-sm font-semibold"
        >
          <RotateCcw className="size-4" />
          Reset dokončených kroků
        </Button>
      </Card>

      <GuideAiAssistantCard manualId={manualId} />
    </aside>
  );
}
