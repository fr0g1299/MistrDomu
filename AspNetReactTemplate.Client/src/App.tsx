import { Wrench, Mail, ScanLine, Video } from "lucide-react";

import Header from "./components/layouts/Header";
import Footer from "./components/layouts/Footer";

// Shadcn Imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "./components/ui/card";
import { Separator } from "./components/ui/separator";

// Steps for "How it Works" section
const steps = [
  {
    icon: ScanLine,
    title: "Naskenuj problém",
    description:
      "Stačí namířit kameru telefonu. Naše AI rozpozná závadu, identifikuje typ zařízení a navrhne možná řešení během vteřin.",
  },
  {
    icon: Video,
    title: "Spoj se s profíkem",
    description:
      "Pokud AI nestačí, jedním kliknutím zahájíte videohovor s certifikovaným řemeslníkem, který vás navede.",
  },
  {
    icon: Wrench,
    title: "Oprav to sám",
    description:
      "S jasným návodem a podporou v zádech opravu dokončíte sami. Ušetříte peníze a získáte pocit hrdosti.",
  },
];

function App() {
  return (
    // TODO: Add dark mode toggle and theme provider
    <html className="scroll-smooth dark" lang="cs">
      <body className="antialiased">
        <Header />

        {/* Hero Section */}
        <div className="relative pt-20 pb-32 px-4 flex flex-col items-center text-center">
          <div className="absolute inset-0 z-0">
            <img
              alt="Craftsman background"
              className="h-full w-full object-cover opacity-10"
              src="/landing_page_bg.webp"
            />
            <div className="hero-gradient absolute inset-0"></div>
          </div>
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-150 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight mb-6 leading-[1.1] animate-[fadeInUp_3s_ease-out]">
              Staň se svým <br />
              <span className="text-primary">
                vlastním <br /> řemeslníkem
              </span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl mb-12 max-w-2xl font-light animate-[fadeInUp_2s_ease-out]">
              Profesionální podpora pro vaše domácí projekty. Od skenování
              problému po videokonzultaci s expertem.
            </p>

            {/* Waitlist */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border text-xs text-muted-foreground mb-8 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>
                Na waitlistu čeká již{" "}
                <strong className="text-primary font-semibold">1,248</strong>{" "}
                kutilů
              </span>
            </div>

            {/* Email Form */}
            <div className="w-full max-w-md flex flex-col items-center">
              <div className="flex flex-col sm:flex-row w-full gap-2 mb-4 bg-card p-1.5 rounded-xl border border-border shadow-sm">
                <div className="relative flex-1 flex items-center">
                  <Mail className="absolute left-3 text-muted-foreground w-5 h-5" />
                  <Input
                    type="email"
                    placeholder="Váš email"
                    className="pl-10 h-12 border-0 focus-visible:ring-2 focus-visible:ring-primary/20 placeholder:text-muted-foreground/70"
                  />
                </div>
                <Button className="h-12 bg-primary text-primary-foreground hover:bg-primary/90 px-8 rounded-lg font-semibold w-full sm:w-auto">
                  Připojit se
                </Button>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground/60 tracking-[0.15em] uppercase font-semibold">
                Prvních 500 získá doživotní slevu 20%
              </p>
            </div>
          </div>
        </div>

        <Separator className="bg-linear-to-r from-border via-primary/30 to-border" />

        {/* How it Works Section */}
        <section className="py-24 bg-[#141414] border-y border-border/40 relative z-10">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-20">
              <span className="text-primary text-[12px] font-bold tracking-[0.15em] uppercase mb-4 block">
                Jednoduchý proces
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Jak to funguje?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto font-light">
                Tři kroky k vyřešení jakéhokoliv problému v domácnosti. Bez
                stresu a zbytečných nákladů.
              </p>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 text-center">
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

        <Footer />
      </body>
    </html>
  );
}

export default App;
