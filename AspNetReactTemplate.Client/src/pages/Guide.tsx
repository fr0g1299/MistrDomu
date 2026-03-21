import { useCallback, useEffect, useMemo, useState } from "react";

import { GuideIntroduction } from "@/components/guide/GuideIntroduction";
import { GuideSteps } from "@/components/guide/GuideSteps";
import { GuideTableOfContents } from "@/components/guide/GuideTableOfContents";

import type { GuideStep, TableOfContentsItem } from "@/types/guide";

const steps: GuideStep[] = [
  {
    id: 1,
    title:
      "Uzavřete vodu Uzavřete vodu Uzavřete vodu Uzavřete vodu Uzavřete vodu ",
    description:
      "Najděte uzavírací ventily pod dřezem. Otočte ventily pro teplou i studenou vodu po směru hodinových ručiček, dokud nebudou pevně uzavřené. Ověřte, že z kohoutku neteče voda, než budete pokračovat.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDOUDgL42NCnaTt4AzmmVpYHQR-gWJN5ADoL9A_tOLG3KWHVj5z5w71q28GUsMck7669ibKsey-JvpbwVaJX-NYh-bn4S7eoZ4caQKIguefdnw3D8_yxzFVfi-S6Dhc6fXLJDkVmH53I_VJr3hpim5NzjAaBeTS6IsRHBLXJ_D0C5_RnjOml4tOT8J5uA_xIWLdFKtwss3x_EUzDKB28PcVEmmYlK90YiflMNcbqMG-9pr-q4DipnZ69nk4ox6qZ5KlwxlQLCUo0Jw",
  },
  {
    id: 2,
    title: "Odstraňte rukojeť",
    description:
      "Použijte imbusový klíč nebo šroubovák k uvolnění fixačního šroubu na rukojeti. Opatrně sundejte rukojeť, abyste odhalili vnitřní kartuši nebo ventil. Použijte imbusový klíč nebo šroubovák k uvolnění fixačního šroubu na rukojeti. Opatrně sundejte rukojeť, abyste odhalili vnitřní kartuši nebo ventil. Použijte imbusový klíč nebo šroubovák k uvolnění fixačního šroubu na rukojeti. Opatrně sundejte rukojeť, abyste odhalili vnitřní kartuši nebo ventil.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBEdWC44HSkO2-HXGanl9ZmYYDygKA8Uobi1dtK7ocNqSM90dX2PQBrUtSG_d9TF1rWVlwuKbCTV9aB6elXiUbH0MHnOyc236a8rd5WMJczR0kTDfb_4veLXBodwdJsHuU6mVKMbT8D1tZIpqeqpbKOTrBCRxEu_OlcbDAUx51pZXKqbCQu0RjpxtLA5YpAXMOTeJT26DFrbCYyFvdxgdCDJ_rEAfyJA1_a6BejUi_-y2Jb_RwQBVyrgoR3_V9U0AFNINcmWWTLpxw",
  },
  {
    id: 3,
    title: "Vyšroubujte kartuši",
    description:
      "Pomocí nastavitelného klíče opatrně vyšroubujte zajišťovací matici držící kartuši. Vytáhněte kartuši přímo nahoru a ven.",
    initiallyCompleted: true,
  },
  {
    id: 4,
    title:
      "Zkontrolujte a vyměňte O-kroužky Zkontrolujte a vyměňte Zkontrolujte a vyměňte",
    description:
      "Prohlédněte O-kroužky a sedla na známky opotřebení, usazenin nebo prasklin. Vyměňte poškozené díly za přesné náhrady z opravářské sady.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAQib0Qyb3anUQWjonc77p2n0FB5XbYvONFuAnnE8PzdDSUz3mebVR8mHloCLQoStyfVuMa6SLgB97D4Fco8dWBn-63lYLg8Q7xqkTmxBcdjezbEkYZVpXkiR6F7IJTSMdlUPKIS-F8N-nyAgK1tvMlqhX3ivOVfFoEACD0ULxlcS2y6mcEaYGvXFyFGNN0-P8OAAH66F56RqeS33u2P42gTPdLvyVvlFuKrKYONhcEGP9VCkovAKLxm_uyT4rBTjgEPd0IHmyaGYQ",
  },
];

const tableOfContents: TableOfContentsItem[] = [
  { id: "introduction", number: "01", label: "Úvod" },
  { id: "tools-required", number: "02", label: "Potřebné nástroje" },
  // { id: "preparation", number: "03", label: "Příprava" },
];

export default function Guide() {
  const stepSectionIds = useMemo(
    () => steps.map((step) => `step-${step.id}`),
    [],
  );
  const trackedSectionIds = useMemo(
    // () => ["introduction", "tools-required", "preparation", ...stepSectionIds],
    () => ["introduction", "tools-required", ...stepSectionIds],
    [stepSectionIds],
  );

  const [completedStepIds, setCompletedStepIds] = useState<Set<number>>(
    () =>
      new Set(
        steps.filter((step) => step.initiallyCompleted).map((step) => step.id),
      ),
  );
  const [activeSectionId, setActiveSectionId] =
    useState<string>("introduction");

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
      <GuideIntroduction />

      <main className="mx-auto w-full xl:max-w-[85vw] 2xl:max-w-[70vw] px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
          <GuideSteps
            steps={steps}
            completedStepIds={completedStepIds}
            onToggleStep={handleToggleStep}
          />

          <GuideTableOfContents
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
