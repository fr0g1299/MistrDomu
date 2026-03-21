import { useState, useEffect, useCallback } from "react";
import {
  Wrench,
  Mail,
  Image,
  Video,
  Search,
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
import { ManualsList } from "./components/manuals/ManualsList";

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

type WaitlistFormProps = {
  onJoined: () => void;
  waitlistCount: number;
  verb: string;
  noun: string;
};

function WaitlistForm({
  onJoined,
  waitlistCount,
  verb,
  noun,
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        onJoined();
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
    <div className="w-full max-w-[26rem] rounded-3xl border-2 border-primary bg-background/90 dark:bg-zinc-900/85 backdrop-blur-sm p-3.5 md:p-4 shadow-[0_0_24px_rgba(245,158,11,0.35)] dark:shadow-[0_0_20px_rgba(245,158,11,0.28)]">
      <div className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-foreground">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/80 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        <span>
          Na waitlistu {verb} již{" "}
          <strong className="font-semibold">
            {waitlistCount.toLocaleString("cs-CZ")}
          </strong>{" "}
          {noun}
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row w-full gap-1.5"
      >
        <div className="relative flex-1 flex items-center rounded-2xl bg-white dark:bg-zinc-900 border border-black/15 dark:border-zinc-700">
          <Mail className="absolute left-3 text-zinc-500 dark:text-zinc-200 w-5 h-5" />
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Váš email"
            className="pl-10 h-11 border-0 bg-transparent text-zinc-900 dark:text-zinc-100 focus-visible:ring-0 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
          />
        </div>
        <Button
          type="submit"
          disabled={status === "loading"}
          className="h-11 bg-primary text-zinc-950 hover:bg-primary/90 px-7 rounded-2xl font-semibold w-full sm:w-auto"
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
          className={`text-center text-sm mt-3 ${status === "success" ? "text-emerald-900" : "text-destructive"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

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

function ManualsSearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <section className="relative z-10 px-4 py-12 md:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <span className="text-primary text-[12px] font-bold tracking-[0.15em] uppercase mb-4 block">
            Návody
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Vyhledávání v návodech
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Napište query a zobrazíme návody odpovídající vašemu hledání.
          </p>
        </div>

        <Card className="mb-10 p-4 md:p-6 border-border/70 bg-card/95">
          <label
            htmlFor="manual-search"
            className="block text-sm font-medium mb-2 text-muted-foreground"
          >
            Search query
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="manual-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Např. pračka, zásuvka, sifon..."
              className="pl-10 h-11"
            />
          </div>
        </Card>

        <ManualsList searchQuery={searchQuery} />
      </div>
    </section>
  );
}

function App() {
  const [waitlistCount, setWaitlistCount] = useState<number>(0);
  const [activeScreen, setActiveScreen] = useState<"home" | "manuals">(
    "home",
  );
  const { verb, noun } = getWaitlistText(waitlistCount);

  const fetchWaitlistCount = useCallback(async () => {
    try {
      const response = await fetch("/api/waitlist/count");
      if (response.ok) {
        const data = await response.json();
        setWaitlistCount(data.count);
      }
    } catch (error) {
      console.error("Error fetching waitlist count:", error);
    }
  }, []);

  useEffect(() => {
    fetchWaitlistCount();
  }, [fetchWaitlistCount]);

  const navigateToManuals = useCallback(() => {
    setActiveScreen("manuals");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const navigateHome = useCallback(() => {
    setActiveScreen("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useDynamicScrollbar();

  return (
    <div className="antialiased selection:text-primary selection:bg-primary/10 dark:selection:bg-primary/5">
      <Header
        activeScreen={activeScreen}
        onNavigateToManuals={navigateToManuals}
        onNavigateHome={navigateHome}
      />
      {/* TODO: Header is gray in light mode with the image underneath */}

      {activeScreen === "home" ? (
        <>
          {/* Hero Section */}
          <div className="pt-20 md:pt-16 pb-12 md:pb-16 px-4 flex flex-col items-center text-center">
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
                Profesionální podpora pro vaše domácí projekty. Od popsání
                problému po videokonzultaci s expertem.
              </p>
            </div>
          </div>

          <Separator className="bg-linear-to-r from-border via-primary/30 to-border" />

          <section className="relative z-10 px-4 -mt-6 md:-mt-10 pt-4 md:pt-6 pb-12 md:pb-16">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
              <div className="w-full flex flex-col items-center md:items-start text-center md:text-left">
                <Button
                  type="button"
                  size="lg"
                  className="w-full max-w-[26rem] h-auto rounded-3xl border-2 border-primary bg-background/90 dark:bg-zinc-900/85 text-zinc-950 dark:text-primary hover:bg-background dark:hover:bg-zinc-900 px-8 py-5 flex flex-col items-center md:items-start gap-1 shadow-[0_0_24px_rgba(245,158,11,0.35)] dark:shadow-[0_0_20px_rgba(245,158,11,0.28)]"
                >
                  <span className="text-2xl md:text-3xl font-semibold leading-tight text-zinc-950 dark:text-primary [text-shadow:0_2px_8px_rgba(0,0,0,0.48)] dark:[text-shadow:0_1px_6px_rgba(245,158,11,0.35)]">
                    Procházet návody
                  </span>
                  <span className="text-sm md:text-base font-medium text-zinc-900 dark:text-zinc-100">
                    Jen pro přihlášené
                  </span>
                </Button>

                <p className="mt-6 w-full max-w-[26rem] text-left text-base md:text-lg font-semibold text-background dark:text-foreground drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                  Projekt je stále ve vývoji, zatím si ale můžete procházet naše
                  návody.
                </p>
              </div>

              <div className="w-full flex flex-col items-center md:items-end">
                <div className="w-full flex justify-center md:justify-end">
                  <WaitlistForm
                    onJoined={fetchWaitlistCount}
                    waitlistCount={waitlistCount}
                    verb={verb}
                    noun={noun}
                  />
                </div>

                <p className="mt-6 w-full max-w-[26rem] text-right text-base md:text-lg font-semibold text-background dark:text-foreground drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                  Připojte se ihned a získejte první videokonzultaci kompletnězdarma!
                </p>
              </div>
            </div>
          </section>

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
                <FlowArrow />

                {/* Umělá inteligence */}
                <div className="text-center flex-1 max-w-xs">
                  <h3 className="text-xl font-bold mb-3 text-primary">
                    Umělá inteligence
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    AI navrženo tak, aby na základě návodů pomáhalo s postupem.
                  </p>
                </div>

                <FlowArrow />

                {/* Pomoc od odborníka */}
                <div className="text-center flex-1 max-w-xs">
                  <h3 className="text-xl font-bold mb-3 text-primary">
                    Pomoc od odborníka
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Možnost videokonzultace pro případ potřeby.
                  </p>
                </div>

                <FlowArrow />

                {/* Vyřešeno */}
                <div className="text-center flex-1 max-w-xs">
                  <h3 className="text-xl font-bold mb-3 text-primary">
                    Vyřešeno
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Další překonaná překážka!
                  </p>
                </div>
              </div>

              <Separator className="mb-20 bg-linear-to-r from-border via-primary/10 to-border" />

              <div className="text-center mb-20">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Podrobněji
                </h2>
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
      ) : (
        <ManualsSearchScreen />
      )}

      <Footer />
    </div>
  );
}

export default App;
