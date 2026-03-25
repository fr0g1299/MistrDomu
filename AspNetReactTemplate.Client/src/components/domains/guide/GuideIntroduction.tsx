import { Clock3, Gauge, Wrench, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MouseEvent } from "react";

import { Separator } from "@/components/ui/separator";
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

const FALLBACK_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAcRfCcA84t_MOJqshbBYFeIbFVspxbHlB_1SiXurzVP1C8vOeTREN_yuNreTdbQnmmj-v5V0jdJuJI8qFxwX6xaK4bVXd5wqtsmmINbzXHkRhU5U7fs7dNADeXBEr8qdEWap_pZJqC4FTaPaVobrVOggyhfILZCASFtSXx7f6DUDe_OiDgdoe_JhuzKmqPF6d94yDPF5aWTG_xWNBXq2ymv9MSVWCnX8ZLEjE_l5--zBeRbZ3rr1DZsYoHlNJJ2CM6jBC0H44EvJQ";

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
      className="relative mb-8 grid w-full xl:min-h-[80vh] 2xl:min-h-[60vh] lg:grid-cols-12"
    >
      <button
        type="button"
        aria-label="Zpět"
        onClick={handleBack}
        className="absolute left-2 top-3 z-20 flex h-12 w-12 items-center justify-center rounded-full text-primary transition-colors duration-300 hover:bg-zinc-200 hover:text-primary-600 dark:hover:bg-card md:left-4 md:top-4"
      >
        <ArrowLeft className="size-9" />
      </button>

      <div className="2xl:ml-50 content-center px-4 py-8 sm:px-6 lg:col-span-5 lg:px-8 lg:py-12">
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

          <div className="w-full">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-card">
                <Wrench className="size-4 text-primary" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Nářadí
              </p>
            </div>

            {tools.length > 0 ? (
              <div className="overflow-x-auto rounded-md border border-zinc-300/70 dark:border-zinc-800/80">
                <table className="w-full min-w-[320px] border-collapse text-sm">
                  <thead className="bg-zinc-100/80 dark:bg-zinc-900/70">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Název</th>
                      <th className="px-3 py-2 text-left font-semibold">Odkaz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tools.map((tool) => (
                      <tr
                        key={tool.id}
                        className="border-t border-zinc-200/80 dark:border-zinc-800/80"
                      >
                        <td className="px-3 py-2 font-medium">{tool.name}</td>
                        <td className="px-3 py-2">
                          {tool.url ? (
                            <a
                              href={tool.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline-offset-2 hover:underline"
                            >
                              {tool.url}
                            </a>
                          ) : (
                            <span className="text-zinc-500">Není uvedeno</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm font-semibold">Není uvedeno</p>
            )}
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
