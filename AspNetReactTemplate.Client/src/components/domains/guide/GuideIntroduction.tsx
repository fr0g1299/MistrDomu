import { Clock3, Gauge, ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MouseEvent } from "react";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { getDifficultyLabel, Manual } from "@/types/manual";

type GuideTool = {
  id: number;
  name: string;
  url?: string;
};

type GuideIntroductionProps = {
  sectionId?: string;
  toolsSectionId?: string;
  manual?: Manual | null;
  tools?: GuideTool[];
};

const FALLBACK_IMAGE = "Place url in the future lol";

export function GuideIntroduction({
  sectionId = "introduction",
  toolsSectionId = "tools-required",
  manual,
  tools = [],
}: GuideIntroductionProps) {
  const navigate = useNavigate();

  const handleBack = (e: MouseEvent) => {
    e.preventDefault();
    navigate(-1);
  };

  const title = manual?.title || "Detail návodu";
  const description =
    manual?.description ||
    "Detailní návod se načte po otevření konkrétního manuálu.";
  const imageUrl = manual?.imageUrl || FALLBACK_IMAGE;
  const difficultyLabel = getDifficultyLabel(manual?.difficulty);

  return (
    <section
      id={sectionId}
      className="scroll-mt-28 relative w-full overflow-hidden"
    >
      <div className="hidden lg:block absolute inset-y-0 right-0 left-[30vw]">
        <img
          alt={title}
          className="h-full w-full object-cover"
          src={imageUrl}
        />
        <div className="absolute inset-0 bg-linear-to-r from-background via-background/40 dark:via-background/60 to-transparent" />
      </div>

      <div className="relative flex min-h-[50vh] py-0 lg:min-h-[60vh]">
        <div className="lg:ml-8 2xl:ml-15 w-full max-w-screen lg:max-w-3xl 2xl:max-w-5xl px-4 sm:pl-6 lg:px-8 lg:pr-16 xl:pr-24">
          <div className="rounded-r-3xl z-10 bg-linear-to-r from-background/95 via-background/85 to-transparent px-2 pt-2 md:pt-14 pb-0 md:pb-6 backdrop-blur-[2px] sm:px-4 lg:px-6 h-full flex flex-col justify-center">
            <div className="flex gap-5 items-center mb-5">
              <button
                type="button"
                aria-label="Zpět"
                onClick={handleBack}
                className="hidden md:flex relative h-14 w-14 items-center justify-center rounded-full text-primary transition-colors duration-300 hover:text-primary-600 hover:bg-card"
              >
                <ArrowLeft className="size-10" />
              </button>
              <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
                {title}
              </h1>
            </div>
            <p className="mb-4 md:mb-8 text-lg text-zinc-800 dark:text-zinc-400">
              {description}
            </p>

            <Separator className="mx-auto max-w-[90%] mb-4 md:mb-6 bg-zinc-700/60" />

            <div className="flex flex-wrap gap-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-card">
                  <Gauge className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Obtížnost
                  </p>
                  <p className="text-sm font-semibold">{difficultyLabel}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-card">
                  <Clock3 className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Čas
                  </p>
                  <p className="text-sm font-semibold">
                    {manual?.estimatedTimeMinutes
                      ? `${manual.estimatedTimeMinutes} minut`
                      : "Není uvedeno"}
                  </p>
                </div>
              </div>

              <div className="w-full lg:w-[70%]">
                {/* Header Section */}
                <h3 className="my-3 text-md font-bold text-zinc-900 dark:text-zinc-100">
                  Budete potřebovat
                </h3>

                {/* Tools List */}
                {tools.length > 0 ? (
                  <ul
                    id={toolsSectionId}
                    className="scroll-mt-28 flex flex-col gap-2"
                  >
                    {tools.map((tool) => (
                      <li
                        key={tool.id}
                        className="group flex items-center justify-between min-h-14.5 rounded-lg border p-3 transition-all border-border bg-linear-to-r from-card to-card/10 hover:border-zinc-700"
                      >
                        {/* Tool Name */}
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 line-clamp-1">
                          {tool.name}
                        </p>

                        {/* Action / Link */}
                        {tool.url && (
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary"
                          >
                            <a href={tool.url} target="_blank" rel="noreferrer">
                              Koupit ZDE
                              <ExternalLink className="size-3" />
                            </a>
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  // Empty State
                  <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-800">
                    <p className="text-sm text-zinc-500">
                      K této opravě nepotřebujete žádné speciální nářadí.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="block lg:hidden relative mt-6">
        <img
          alt={title}
          className="max-h-100 w-full object-cover"
          src={imageUrl}
        />
      </div>
    </section>
  );
}
