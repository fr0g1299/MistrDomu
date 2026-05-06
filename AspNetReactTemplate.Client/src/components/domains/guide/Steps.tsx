import { Check, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageZoom } from "@/components/shared/ImageZoom";

import type { GuideStep } from "@/types/manual";

type StepsProps = {
  sectionId?: string;
  steps: GuideStep[];
  completedStepIds: Set<number>;
  isAiChatVisible?: boolean;
  onToggleStep: (stepId: number) => void;
};

export function Steps({
  sectionId = "steps",
  steps,
  completedStepIds,
  isAiChatVisible,
  onToggleStep,
}: StepsProps) {
  return (
    <section
      id={sectionId}
      className={`space-y-6 xl:col-span-20 ${isAiChatVisible ? "lg:col-span-23" : "lg:col-span-25"}`}
    >
      {steps.map((step) => {
        const isCompleted = completedStepIds.has(step.id);
        const cardClassName = isCompleted
          ? "gap-0 border-primary/20 bg-card p-6 scroll-mt-22"
          : "gap-0 border-border bg-card p-6 transition-colors scroll-mt-22";
        const iconWrapperClassName = isCompleted
          ? "flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          : "flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-primary/40 text-lg font-black text-primary";
        const titleClassName = isCompleted
          ? "text-2xl font-bold text-zinc-700 dark:text-zinc-400 line-through wrap-break-word max-w-full"
          : "text-2xl font-bold wrap-break-word max-w-full";
        const buttonClassName = isCompleted
          ? "h-7 bg-primary px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground hover:bg-primary/90"
          : "h-7 bg-zinc-300 dark:bg-border px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-950 dark:text-primary dark:hover:bg-zinc-700 hover:bg-zinc-400";

        return (
          <motion.div
            key={step.id}
            layout
            initial={false}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <Card id={`step-${step.id}`} className={cardClassName}>
              <div>
                <div className="flex items-start sm:items-center gap-4 mb-3">
                  <div className={iconWrapperClassName}>
                    {isCompleted ? <Check className="size-5" /> : step.id}
                  </div>
                  <div className="grid gap-y-2 md:gap-y-2.5 w-full">
                    {/* Title */}
                    <h3 className={titleClassName}>{step.title}</h3>

                    {/* Button */}
                    <div className="items-end sm:items-start flex flex-col">
                      <Button
                        type="button"
                        onClick={() => onToggleStep(step.id)}
                        size="xs"
                        className={buttonClassName}
                      >
                        {isCompleted ? (
                          <Check className="size-3.5" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        {isCompleted ? "Hotovo" : "Označit jako hotové"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* TODO: This weirdly closes first and then expands */}
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    // Compact Description
                    <motion.div
                      key="completed-content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="md:mt-3 text-zinc-700 dark:text-zinc-400 whitespace-normal line-clamp-2">
                        {step.content}
                      </p>
                    </motion.div>
                  ) : (
                    // Full Description and Image
                    <motion.div
                      key="open-content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="w-full md:mt-3">
                        {/* TODO: In the future display RICH content (maybe md woudl suffice) */}
                        <p className="text-zinc-700 dark:text-zinc-400 whitespace-normal">
                          {step.content}
                        </p>

                        {step.imageUrl && (
                          <>
                            <ImageZoom zoomOnHover={false}>
                              <img
                                src={step.imageUrl}
                                alt={step.title}
                                width={812} // TODO: This should ideally be dynamic
                                className="mt-4 rounded-md"
                              />
                            </ImageZoom>
                          </>
                        )}
                        {/* TODO: Below every step should be a button, that would show a Note field to save user's notes */}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </section>
  );
}
