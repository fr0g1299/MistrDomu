import { Clock3, Gauge, Wrench } from "lucide-react";

import { Separator } from "@/components/ui/separator";

type GuideIntroductionProps = {
  sectionId?: string;
  toolsSectionId?: string;
};

export function GuideIntroduction({
  sectionId = "introduction",
  toolsSectionId = "tools-required",
}: GuideIntroductionProps) {
  return (
    <section
      id={sectionId}
      className="mb-8 grid w-full xl:h-[80vh] 2xl:h-[60vh] lg:grid-cols-12"
    >
      <div className="2xl:ml-50 content-center px-4 py-8 sm:px-6 lg:col-span-5 lg:px-10 lg:py-12">
        {/* Category */}
        {/* <div className="mb-4 flex items-center gap-2">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
            Instalace
          </span>
          <span className="size-1 rounded-full bg-zinc-600" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Kuchyně
          </span>
        </div> */}

        <h1 className="mb-5 max-w-xl text-4xl font-extrabold leading-tight md:text-6xl">
          Jak opravit kapající kuchyňskou baterii
        </h1>
        <p className="mb-8 max-w-xl text-zinc-800 dark:text-zinc-400">
          Zastavte kapání a ušetřete vodu. Tento podrobný průvodce vás provede
          diagnostikou a opravou běžných netěsností kuchyňské baterie bez volání
          instalatéra.
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
              <p className="text-sm font-semibold">Začátečník</p>
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
              <p className="text-sm font-semibold">45 minut</p>
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
              <p className="text-sm font-semibold">Klíč, kleště, šroubovák</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative min-h-75 overflow-hidden lg:col-span-7 lg:min-h-105">
        <img
          alt="Kitchen faucet repair"
          className="absolute inset-0 h-full w-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcRfCcA84t_MOJqshbBYFeIbFVspxbHlB_1SiXurzVP1C8vOeTREN_yuNreTdbQnmmj-v5V0jdJuJI8qFxwX6xaK4bVXd5wqtsmmINbzXHkRhU5U7fs7dNADeXBEr8qdEWap_pZJqC4FTaPaVobrVOggyhfILZCASFtSXx7f6DUDe_OiDgdoe_JhuzKmqPF6d94yDPF5aWTG_xWNBXq2ymv9MSVWCnX8ZLEjE_l5--zBeRbZ3rr1DZsYoHlNJJ2CM6jBC0H44EvJQ"
        />
        <div className="hidden md:block absolute inset-0 bg-linear-to-r from-background via-background/40 dark:via-background/55 to-transparent" />
      </div>
    </section>
  );
}
