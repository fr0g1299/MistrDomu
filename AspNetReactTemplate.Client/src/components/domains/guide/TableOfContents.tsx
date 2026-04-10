import { CheckCircle2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { GuideStep, TableOfContentsItem } from "@/types/manual";

type TableOfContentsProps = {
  tableOfContents: TableOfContentsItem[];
  steps: GuideStep[];
  completedStepIds: Set<number>;
  activeSectionId: string;
  onScrollTo: (sectionId: string) => void;
  onResetCompletedSteps: () => void;
};

export function TableOfContents({
  tableOfContents,
  steps,
  completedStepIds,
  activeSectionId,
  onScrollTo,
  onResetCompletedSteps,
}: TableOfContentsProps) {
  return (
    <aside className="hidden h-fit max-h-[90vh] flex-col gap-4 xl:sticky xl:top-24 xl:col-span-5 xl:flex">
      <Card className="gap-4 border-border bg-card pl-3 pr-2 py-5">
        <div className="px-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
            Průvodce opravou
          </p>
          <h2 className="text-xl font-bold">Obsah</h2>
        </div>

        <nav>
          <div className="space-y-1">
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
          </div>

          <Separator className="my-3 bg-zinc-400 dark:bg-zinc-800" />

          <div className="max-h-[60vh] overflow-y-auto solid-scrollbar pt-1">
            <div className="space-y-1 mr-1">
              {steps.map((step) => {
                // For testing purposes, this is generating more items repeatedly
                {
                  /* {Array.from({ length: 20 }).map((_, index) => { */
                }
                // const step = steps[index % steps.length];
                const stepSectionId = `step-${step.id}`;
                const isCompleted = completedStepIds.has(step.id);
                const isActive = activeSectionId === stepSectionId;

                return (
                  <button
                    key={`toc-step-${step.id}`}
                    type="button"
                    onClick={() => onScrollTo(stepSectionId)}
                    className={`flex items-center justify-between w-full rounded-md border-l-2 px-2 py-3 transition-colors duration-300
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
            </div>
          </div>
        </nav>

        <Button
          type="button"
          variant="outline"
          onClick={onResetCompletedSteps}
          disabled={completedStepIds.size === 0}
          className="h-10 gap-2 text-sm font-semibold"
        >
          <RotateCcw className="size-4" />
          <span className="hidden 2xl:block">Reset dokončených kroků</span>
        </Button>
      </Card>
    </aside>
  );
}
