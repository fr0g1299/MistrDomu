import { Clock3, Gauge, Wrench, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MouseEvent } from "react";

import { Separator } from "@/components/ui/separator";
import { Difficulty, Manual } from "@/types/manual";

type GuideIntroductionProps = {
  sectionId?: string;
  toolsSectionId?: string;
  manual?: Manual | null;
};

const FALLBACK_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAcRfCcA84t_MOJqshbBYFeIbFVspxbHlB_1SiXurzVP1C8vOeTREN_yuNreTdbQnmmj-v5V0jdJuJI8qFxwX6xaK4bVXd5wqtsmmINbzXHkRhU5U7fs7dNADeXBEr8qdEWap_pZJqC4FTaPaVobrVOggyhfILZCASFtSXx7f6DUDe_OiDgdoe_JhuzKmqPF6d94yDPF5aWTG_xWNBXq2ymv9MSVWCnX8ZLEjE_l5--zBeRbZ3rr1DZsYoHlNJJ2CM6jBC0H44EvJQ";

function getDifficultyLabel(difficulty?: number): string {
  if (difficulty === Difficulty.Easy) return "Začátečník";
  if (difficulty === Difficulty.Medium) return "Středně pokročilý";
  if (difficulty === Difficulty.Hard) return "Pokročilý";
  return "Neznámá";
}

function getToolsLabel(requiredTools?: string): string {
  const value = requiredTools?.trim();
  return value && value.length > 0 ? value : "Není uvedeno";
}

export function GuideIntroduction({
  sectionId = "introduction",
  toolsSectionId = "tools-required",
  manual,
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
  const toolsLabel = getToolsLabel(manual?.requiredTools);

  return (
    <section
      id={sectionId}
      className="mb-8 grid w-full xl:min-h-[80vh] 2xl:min-h-[60vh] lg:grid-cols-12"
    >
      <div className="2xl:ml-50 content-center px-4 py-8 sm:px-6 lg:col-span-5 lg:px-8 lg:py-12">
        {/* Back button */}
        <div className="mb-6 flex items-center gap-2">
          <button
            type="button"
            aria-label="Go back"
            onClick={handleBack}
            className="flex h-14 w-14 mr-4 text-primary hover:text-primary-600 items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-card transition-colors duration-300"
          >
            <ArrowLeft className="size-12" />
          </button>

          {/* Category */}
          {/* <span className="rounded-full bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
            Instalace
          </span>
          <span className="size-1 rounded-full bg-zinc-600" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Kuchyně
          </span> */}
        </div>

        <h1 className="mb-5 max-w-xl text-4xl font-extrabold leading-tight md:text-6xl">
          {title}
        </h1>
        <p className="mb-8 max-w-xl text-zinc-800 dark:text-zinc-400">
          {description}
        </p>

        <Separator className="mb-6 bg-zinc-400/70 dark:bg-zinc-800/70" />

        <div id={toolsSectionId} className="scroll-mt-28 flex flex-wrap gap-5">
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

          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-card">
              <Wrench className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Nářadí
              </p>
              <p className="text-sm font-semibold">{toolsLabel}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative min-h-75 overflow-hidden lg:col-span-7 lg:min-h-105">
        <img
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
          src={imageUrl}
        />
        <div className="hidden md:block absolute inset-0 bg-linear-to-r from-background via-background/40 dark:via-background/55 to-transparent" />
      </div>
    </section>
  );
}
