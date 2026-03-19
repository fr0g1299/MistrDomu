import { useState, useEffect } from "react";
import {
  Wrench,
  Mail,
  Image,
  Video,
  Loader2,
  BookOpen,
  ArrowRight,
  ArrowDown,
} from "lucide-react";

import Header from "./components/layouts/Header";
import Footer from "./components/layouts/Footer";

// Shadcn Imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "./components/ui/card";
import { Separator } from "./components/ui/separator";
import { useDynamicScrollbar } from "./hooks/useDynamicScrollbar";

// Steps for "How it Works" section
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

// Function to get correct verb and noun based on count using Intl.PluralRules
const getWaitlistText = (count: number) => {
  const rule = new Intl.PluralRules("cs-CZ").select(count);

  const mapping = {
    one: { verb: "čeká", noun: "kutil" },
    few: { verb: "čekají", noun: "kutilové" },
    other: { verb: "čeká", noun: "kutilů" },
  };

  // Fallback to other if the rule is something different
  return mapping[rule as keyof typeof mapping] || mapping.other;
};

function App() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [waitlistCount, setWaitlistCount] = useState<number>(0);
  const { verb, noun } = getWaitlistText(waitlistCount);

  const fetchWaitlistCount = async () => {
    try {
      const response = await fetch("/api/waitlist/count");
      if (response.ok) {
        const data = await response.json();
        setWaitlistCount(data.count);
      }
    } catch (error) {
      console.error("Error fetching waitlist count:", error);
    }
  };

  useEffect(() => {
    fetchWaitlistCount();
  }, []);
  useDynamicScrollbar();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus("success");
        setMessage("Děkujeme! Jste na čekací listině.");
        setEmail("");
        fetchWaitlistCount();
      } else {
        const errorData = await response.text();
        setStatus("error");
        setMessage(errorData || "Něco se nepovedlo. Zkuste to později.");
      }
    } catch (error) {
      console.error("Error joining waitlist:", error);
      setStatus("error");
      setMessage("Chyba připojení k serveru.");
    }
  };

  return (
    <body className="antialiased selection:text-primary selection:bg-primary/10 dark:selection:bg-primary/5">
      <Header />
      {/* TODO: Header is gray in light mode with the image underneath */}

      {/* Hero Section */}
      <div className="pt-40 pb-40 px-4 flex flex-col items-center text-center">
        <div className="absolute inset-0 z-0">
          <img
            alt="Craftsman background"
            className="h-full w-full object-cover object-[center_65%] brightness-35 dark:brightness-20"
            src="/landing_page_bg.webp"
          />
        </div>
        {/* Glow */}
        <div className="absolute top-[5vh] left-1/2 -translate-x-1/2 w-[75vw] md:w-[30vw] h-[60vw] md:h-[25vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center mx-auto max-w-[90vw]">
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-background dark:text-foreground tracking-tight mb-6 leading-[1.1] animate-[fadeInUp_3s_ease-out]">
            Staň se svým <br />
            <span className="text-primary">
              vlastním <br /> řemeslníkem
            </span>
          </h1>

          <p className="text-muted/90 dark:text-muted-foreground text-lg md:text-xl mb-12 max-w-2xl font-light animate-[fadeInUp_2s_ease-out]">
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
              Na waitlistu {verb} již{" "}
              <strong className="text-primary-700 dark:text-primary font-semibold">
                {waitlistCount.toLocaleString("cs-CZ")}
              </strong>{" "}
              {noun}
            </span>
          </div>

          {/* Email Form */}
          <div className="w-full max-w-md flex flex-col items-center">
            <p className="text-base md:text-lg font-semibold text-background dark:text-foreground mb-6">
              Připojte se hned a získejte první videokonzultaci zdarma!
            </p>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row w-full gap-2 mb-4 bg-card p-1.5 rounded-xl border border-border shadow-sm focus-within:border-primary/50 transition-colors"
            >
              <div className="relative flex-1 flex items-center">
                <Mail className="absolute left-3 text-muted-foreground w-5 h-5" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Váš email"
                  className="pl-10 h-12 border-0 focus-visible:ring-0 placeholder:text-muted-foreground/70"
                />
              </div>
              <Button
                type="submit"
                disabled={status === "loading"}
                className="h-12 bg-primary text-primary-foreground hover:bg-primary/90 px-8 rounded-lg font-semibold w-full sm:w-auto"
              >
                {status === "loading" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Připojit se"
                )}
              </Button>
            </form>

            {message && (
              <p
                className={`text-sm mb-4 ${status === "success" ? "text-green-500" : "text-destructive"}`}
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator className="bg-linear-to-r from-border via-primary/30 to-border" />

      {/* How it Works Section */}
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

          {/* Process Flow - inline */}
          <div className="mb-20 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            {/* Návody */}
            <div className="text-center flex-1 max-w-xs">
              <h3 className="text-xl font-bold mb-3 text-primary">Návody</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Lidmi ručně vytvořené a otestované návody.
              </p>
            </div>

            {/* This looks bad, clean it up in the future */}
            {window.innerWidth >= 768 ? (
              <ArrowRight size={30} strokeWidth={2.5} color="#f59e0a" />
            ) : (
              <ArrowDown size={30} strokeWidth={2.5} color="#f59e0a" />
            )}

            {/* Umělá inteligence */}
            <div className="text-center flex-1 max-w-xs">
              <h3 className="text-xl font-bold mb-3 text-primary">
                Umělá inteligence
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                AI navrženo tak, aby na základě návodů pomáhalo s postupem.
              </p>
            </div>

            {window.innerWidth >= 768 ? (
              <ArrowRight size={30} strokeWidth={2.5} color="#f59e0a" />
            ) : (
              <ArrowDown size={30} strokeWidth={2.5} color="#f59e0a" />
            )}

            {/* Pomoc od odborníka */}
            <div className="text-center flex-1 max-w-xs">
              <h3 className="text-xl font-bold mb-3 text-primary">
                Pomoc od odborníka
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Možnost videokonzultace pro případ potřeby.
              </p>
            </div>

            {window.innerWidth >= 768 ? (
              <ArrowRight size={30} strokeWidth={2.5} color="#f59e0a" />
            ) : (
              <ArrowDown size={30} strokeWidth={2.5} color="#f59e0a" />
            )}

            {/* Vyřešeno */}
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

      <Footer />
    </body>
  );
}

export default App;
