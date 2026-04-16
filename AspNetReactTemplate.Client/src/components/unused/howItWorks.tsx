import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  Bot,
  CheckSquare,
  FileCheck,
  HelpingHand,
  Info,
  MessageCircleQuestionMark,
  PhoneCall,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FlowItem = {
  icon: typeof BookOpen;
  title: string;
  description: ReactNode;
  points: ReactNode[];
  ctaLabel?: string;
  ctaTo?: string;
};

const helpFlow: FlowItem[] = [
  {
    icon: MessageCircleQuestionMark,
    title: "Máte problém? My máme návod!",
    description: (
      <>
        Ve vyhledávání najdete řešení podle <strong className="font-semibold text-primary">názvu problému</strong>,
        i klíčových slov. U každého výsledku vidíte <strong className="font-semibold text-primary">krátký popis</strong>,
        odhad <strong className="font-semibold text-primary">časové náročnosti</strong> a <strong className="font-semibold text-primary">složitost</strong>,
        abyste si snadno vybrali návod podle svých schopností.
      </>
    ),
    points: [
      <>
        Hledání podle <strong className="font-semibold text-primary">názvu problému</strong> a
        <strong className="font-semibold text-primary"> klíčových slov</strong>.
      </>,
      <>
        <strong className="font-semibold text-primary">Krátký popis</strong>,
        <strong className="font-semibold text-primary"> časová náročnost</strong> a
        <strong className="font-semibold text-primary"> složitost</strong> u každého výsledku.
      </>,
      <>
        Návody <strong className="font-semibold text-primary">vytvořené</strong> a
        <strong className="font-semibold text-primary"> testované lidmi</strong>.
      </>,
    ],
    ctaLabel: "Projít návody",
    ctaTo: "/search",
  },
  {
    icon: BookOpen,
    title: "Postupujte v návodu krok za krokem",
    description: (
      <>
        Každý návod má přehledný popis, postup krok za krokem a část s
        <strong className="font-semibold text-primary"> potřebnými pomůckami</strong>. Některé pomůcky mají i odkazy na
        <strong className="font-semibold text-primary"> e-shopy našich partnerů</strong>.
      </>
    ),
    points: [
      <>
        <strong className="font-semibold text-primary">Popis návodu</strong> přímo nahoře a
        <strong className="font-semibold text-primary"> jasný postup</strong> pod ním.
      </>,
      <>
        <strong className="font-semibold text-primary">Potřebné pomůcky</strong> a materiál pro konkrétní opravu.
      </>,
      <>
        U části položek i odkazy na <strong className="font-semibold text-primary">e-shopy partnerů</strong>.
      </>,
      <>
        Průběh si označujete a <strong className="font-semibold text-primary">postup se ukládá</strong>.
      </>,
    ],
  },
  {
    icon: Bot,
    title: "Konzultace s AI k danému návodu",
    description: (
      <>
        AI je tu jako <strong className="font-semibold text-primary">pomocník pro pochopení návodu</strong>.
        Je navržené tak, aby se drželo jen obsahu otevřeného manuálu a
        <strong className="font-semibold text-primary"> nevymýšlelo si</strong> postupy mimo něj.
      </>
    ),
    points: [
      <>
        AI se drží jen <strong className="font-semibold text-primary">konkrétního návodu</strong>.
      </>,
      <>
        <strong className="font-semibold text-primary">Nevymýšlí si</strong> vlastní postupy mimo obsah manuálu.
      </>,
      <>
        <strong className="font-semibold text-primary">2 dotazy zdarma</strong> pro každý návod.
      </>,
      <>
        Za <strong className="font-semibold text-primary">100 Kč</strong> neomezená konzultace pro daný návod napořád.
      </>,
    ],
  },
  {
    icon: PhoneCall,
    title: "Když AI nestačí, zavolejte online expertovi",
    description: (
      <>
        Pokud AI nepomůže, nebo ji nechcete odemykat, můžete se
        <strong className="font-semibold text-primary"> ihned spojit s online expertem</strong>,
        pokud je zrovna dostupný.
      </>
    ),
    points: [
      <>
        <strong className="font-semibold text-primary">Rychlé spojení s člověkem</strong>, pokud je expert online.
      </>,
      <>
        Vhodné i pro uživatele, kteří si <strong className="font-semibold text-primary">AI nechtějí platit</strong>.
      </>,
      <>
        Vyřešení problému za poplatek <strong className="font-semibold text-primary">přímo s expertem</strong>.
      </>,
    ],
  },
  {
    icon: CheckSquare,
    title: "Hotovo!",
    description: (
      <>
        Po dokončení práce máte nejen ušetřené peníze za servis nebo řemeslníka, ale i
        <strong className="font-semibold text-primary"> nové praktické zkušenosti</strong>,
        které využijete příště.
      </>
    ),
    points: [
      <>
        <strong className="font-semibold text-primary">Nové zkušenosti</strong>, které využijete příště.
      </>,
      <>
        Často i <strong className="font-semibold text-primary">výrazná úspora peněz</strong> oproti servisu.
      </>,
    ],
  },
];

const expertFlow: FlowItem[] = [
  {
    icon: UserPlus,
    title: "Získejte zkušenosti i přivýdělek jako Expert na našem webu!",
    description: (
      <>
        Jste studentem řemeslných oborů nebo kutil, který chce pomáhat ostatním?
        <strong className="font-semibold text-primary"> Onboarding</strong> je vstupní bránou do světa expertů.
        Získáte <strong className="font-semibold text-primary">praxi</strong> na reálných problémech uživatelů
        a můžete si <strong className="font-semibold text-primary">přivydělat</strong> vedle školy i práce.
      </>
    ),
    points: [
      <>
        <strong className="font-semibold text-primary">Onboarding</strong> je vstupní bod do expertní role.
      </>,
      <>
        Ideální model při <strong className="font-semibold text-primary">škole</strong>, jako
        <strong className="font-semibold text-primary"> koníček</strong> i
        <strong className="font-semibold text-primary"> přivýdělek</strong>.
      </>,
      <>
        Sbíráte <strong className="font-semibold text-primary">praxi</strong> na reálných problémech uživatelů.
      </>,
    ],
    ctaLabel: "Přejít na onboarding",
    ctaTo: "/expert-onboarding",
  },
  {
    icon: FileCheck,
    title: "Personalizujte si, u kterých návodů pomáháte",
    description: (
      <>
        Své služby nabízíte jen u návodů, kterým opravdu rozumíte. Expert si může podle
        <strong className="font-semibold text-primary"> vlastních znalostí</strong> personalizovat oblasti,
        kde chce být <strong className="font-semibold text-primary">dostupný</strong>.
      </>
    ),
    points: [
      <>
        Volíte si témata podle <strong className="font-semibold text-primary">vlastních znalostí</strong> a
        <strong className="font-semibold text-primary"> specializace</strong>.
      </>,
      <>
        Nabízíte pomoc jen tam, kde máte <strong className="font-semibold text-primary">jistotu</strong>.
      </>,
      <>
        Profil pomoci si průběžně <strong className="font-semibold text-primary">upravujete</strong> podle potřeby.
      </>,
    ],
  },
  {
    icon: HelpingHand,
    title: "Pomáhejte kdykoliv, kdy se to VÁM hodí",
    description: (
      <>
        Kdykoliv podle svých preferencí přepnete do <strong className="font-semibold text-primary">online</strong>
        (aktivního) režimu. V tu chvíli vás uživatelé vidí jako
        <strong className="font-semibold text-primary"> dostupného experta</strong> pro okamžitou konzultaci.
      </>
    ),
    points: [
      <>
        <strong className="font-semibold text-primary">Online/offline</strong> přepínáte kdykoliv dle svých preferencí.
      </>,
      <>
        V aktivním režimu se zobrazujete jako
        <strong className="font-semibold text-primary"> dostupný expert</strong>.
      </>,
      <>
        Dostupnost snadno sladíte se <strong className="font-semibold text-primary">školou</strong>,
        <strong className="font-semibold text-primary"> prací</strong> i volným časem.
      </>,
    ],
  },
  {
    icon: Info,
    title: "Máte zájem? Více info získáte přímou komunikací!",
    description: (
      <>
        Pokud vás zajímají podrobnosti k <strong className="font-semibold text-primary">pracovním příležitostem</strong>,
        spolupráci nebo získávání <strong className="font-semibold text-primary">praxe</strong>, napište nám
        <strong className="font-semibold text-primary"> e-mail</strong>. Ozveme se s konkrétními možnostmi podle
        vašeho zaměření.
      </>
    ),
    points: [
      <>
        Podrobnosti o <strong className="font-semibold text-primary">spolupráci</strong> a
        <strong className="font-semibold text-primary"> praxi</strong> řešíme individuálně přes
        <strong className="font-semibold text-primary"> e-mail</strong>.
      </>,
      <>
        Snadno zjistíte aktuální možnosti podle vašich
        <strong className="font-semibold text-primary"> zkušeností</strong>.
      </>,
      <>
        Stačí napsat a dostanete další informace i
        <strong className="font-semibold text-primary"> doporučený postup</strong>.
      </>,
    ],
  }
];

function FlowSections({ items }: { items: FlowItem[] }) {
  return (
    <div className="w-full space-y-8 md:space-y-22 lg:space-y-22">
      {items.map((item, index) => (
        <article
          key={item.title}
          className="relative bg-transparent text-zinc-50"
          style={{ animation: `fadeInUp ${0.45 + index * 0.12}s ease-out` }}
        >
          <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-10 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)] lg:gap-12 lg:px-16 lg:py-12">
            <div className="space-y-5 md:space-y-6">
            <div className="mt-1 inline-flex rounded-xl border border-primary/30 bg-primary/10 p-2 text-primary md:p-2.5">
                <item.icon className="size-5 md:size-12" />
            </div>
              <div className="flex items-start gap-3 md:gap-4">
                <h3 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight text-balance md:text-5xl xl:text-6xl">
                  {item.title}
                </h3>
              </div>
              <p className="max-w-4xl text-base leading-relaxed text-zinc-100/90 md:text-lg xl:text-xl">
                {item.description}
              </p>
              {item.ctaLabel && item.ctaTo && (
                <Button
                  asChild
                  className={
                    item.ctaLabel === "Projít návody" || item.ctaLabel === "Přejít na onboarding"
                      ? "h-20 rounded-xl px-10 text-xl font-semibold"
                      : "h-10 rounded-xl px-5 text-sm font-semibold"
                  }
                >
                  <Link to={item.ctaTo}>{item.ctaLabel}</Link>
                </Button>
              )}
            </div>

            <div className="flex h-full flex-col justify-center gap-4">
              <div className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
                <div className="mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/90">
                    Souhrn a tipy
                  </p>
                </div>
                <ul className="space-y-2 text-sm leading-relaxed text-zinc-100/90 md:text-base">
                  {item.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function HowItWorks() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"help" | "expert">("help");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const flow = params.get("flow");

    if (flow === "expert") {
      setActiveTab("expert");
    } else if (flow === "help") {
      setActiveTab("help");
    }

    if (location.hash === "#jak-to-funguje") {
      const section = document.getElementById("jak-to-funguje");
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.search, location.hash]);

  return (
    <section id="jak-to-funguje" className="relative overflow-hidden border-y border-border/30 bg-transparent py-16 md:py-24">
      <div className="relative w-full">
        <div className="mx-auto mb-10 max-w-6xl px-6 text-center md:mb-12">
          <span className="mb-3 block text-[12px] font-bold tracking-[0.15em] text-primary uppercase">
            Popis aplikace
          </span>
          <h2 className="text-4xl font-black tracking-tight md:text-6xl xl:text-7xl">Jak to funguje?</h2>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "help" | "expert")}
          className="w-full items-center"
        >
          <TabsList className="mx-auto mb-8 grid h-16 w-full max-w-4xl grid-cols-2 items-stretch rounded-2xl border border-primary/35 bg-black/35 p-1.5 backdrop-blur-sm md:h-20">
            <TabsTrigger value="help" className="h-full rounded-xl px-6 text-base font-bold text-zinc-200 transition-colors md:px-10 md:text-xl data-[state=active]:bg-white/14 data-[state=active]:text-white data-[state=active]:shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:text-zinc-50">
              Potřebuji pomoc
            </TabsTrigger>
            <TabsTrigger value="expert" className="h-full rounded-xl px-6 text-base font-bold text-zinc-200 transition-colors md:px-10 md:text-xl data-[state=active]:bg-white/14 data-[state=active]:text-white data-[state=active]:shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:text-zinc-50">
              Chci pomáhat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="help" className="w-full animate-[fadeInUp_0.45s_ease-out]">
            <div className="relative left-1/2 w-screen -translate-x-1/2">
              <FlowSections items={helpFlow} />
            </div>
          </TabsContent>

          <TabsContent value="expert" className="w-full animate-[fadeInUp_0.45s_ease-out]">
            <div className="relative left-1/2 w-screen -translate-x-1/2">
              <FlowSections items={expertFlow} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
