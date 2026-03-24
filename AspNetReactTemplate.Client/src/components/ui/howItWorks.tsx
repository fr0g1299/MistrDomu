import { Wrench, Image, Video, BookOpen, ArrowRight, ArrowDown } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const steps = [
  {
    icon: BookOpen,
    title: "Návody",
    description: (
      <>
        Všechny naše nástroje jsou založeny na{" "}
        <strong className="font-bold text-foreground">
          lidmi ručně vytvořených a otestovaných návodech
        </strong>
        . Tyto návody jsou páteří našeho systému a zajišťují kvalitu a
        spolehlivost.
      </>
    ),
  },
  {
    icon: Image,
    title: "Vysvětli problém",
    description: (
      <>
        Stačí popsat problém a přidat fotografie. Naše AI rozpozná závadu,
        identifikuje typ zařízení a navrhne možná řešení během vteřin. AI čerpá
        z{" "}
        <strong className="font-bold text-foreground">
          lidmi vytvořených a ověřených návodů
        </strong>
        .
      </>
    ),
  },
  {
    icon: Video,
    title: "Spoj se s profíkem",
    description:
      "Pokud AI nestačí, jedním kliknutím zahájíte videohovor s řemeslníkem, který Vám pomůže.",
  },
  {
    icon: Wrench,
    title: "Oprav to sám",
    description:
      "S jasným návodem a podporou v zádech opravu dokončíte sami. Ušetříte peníze, získáte zkušenosti a pocit hrdosti.",
  },
];

function FlowArrow() {
  return (
    <>
      <ArrowRight
        className="hidden md:block text-primary"
        size={30}
        strokeWidth={2.5}
      />
      <ArrowDown
        className="block md:hidden text-primary"
        size={30}
        strokeWidth={2.5}
      />
    </>
  );
}

export function HowItWorks() {
  return (
    <>
      <Separator className="bg-linear-to-r from-border via-primary/30 to-border" />

      <section
        id="jak-to-funguje"
        className="py-24 bg-card border-y border-border/40 relative z-10"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-primary text-[12px] font-bold tracking-[0.15em] uppercase mb-4 block">
              Jednoduchý proces
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Jak to funguje?
            </h2>
          </div>

          <div className="mb-20 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            <div className="text-center flex-1 max-w-xs">
              <h3 className="text-xl font-bold mb-3 text-primary">Návody</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Lidmi ručně vytvořené a otestované návody.
              </p>
            </div>

            <FlowArrow />

            <div className="text-center flex-1 max-w-xs">
              <h3 className="text-xl font-bold mb-3 text-primary">
                Umělá inteligence
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                AI navrženo tak, aby na základě návodů pomáhalo s postupem.
              </p>
            </div>

            <FlowArrow />

            <div className="text-center flex-1 max-w-xs">
              <h3 className="text-xl font-bold mb-3 text-primary">
                Pomoc od odborníka
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Možnost videokonzultace pro případ potřeby.
              </p>
            </div>

            <FlowArrow />

            <div className="text-center flex-1 max-w-xs">
              <h3 className="text-xl font-bold mb-3 text-primary">Vyřešeno</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Další překonaná překážka!
              </p>
            </div>
          </div>

          <Separator className="mb-20 bg-linear-to-r from-border via-primary/10 to-border" />

          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Podrobněji</h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-8 text-center">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative z-10 flex flex-col items-center group"
              >
                <Card className="inset-ring-2 inset-ring-ring/10 w-24 h-24 rounded-3xl bg-card flex items-center justify-center mb-6 group-hover:inset-ring-primary/50 group-hover:scale-105 drop-shadow-2xl drop-shadow-transparent group-hover:drop-shadow-primary/20 duration-300 transition-all">
                  <step.icon
                    className="w-8 h-8 text-foreground"
                    strokeWidth={1.5}
                  />
                </Card>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs font-light">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}