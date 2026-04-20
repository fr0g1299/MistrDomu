import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { AuthRequiredDialog } from "@/components/identity/AuthRequiredDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  expertFlow,
  helpFlow,
  FlowItem,
} from "@/components/domains/homepage/flowDefinitions";

function FlowSections({
  items,
  onBrowseManualsClick,
}: {
  items: FlowItem[];
  onBrowseManualsClick: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(
    () => new Set(),
  );

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>("[data-flow-index]"),
    );
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const rawIndex = entry.target.getAttribute("data-flow-index");
          const index = Number(rawIndex);
          if (Number.isNaN(index)) return;

          setVisibleIndices((prev) => {
            if (prev.has(index)) return prev;
            const next = new Set(prev);
            next.add(index);
            return next;
          });

          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -20% 0px",
      },
    );

    nodes.forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
    };
  }, [items]);

  return (
    <div
      ref={containerRef}
      className="w-full space-y-8 md:space-y-22 lg:space-y-22"
    >
      {items.map((item, index) => {
        const isVisible = visibleIndices.has(index);

        return (
          <article
            key={item.title}
            data-flow-index={index}
            className="relative bg-transparent text-zinc-50"
          >
            <div className="mx-auto grid items-center w-full max-w-400 grid-cols-1 gap-10 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)] lg:gap-12 lg:px-16 lg:py-12">
              <div
                className={`space-y-5 md:space-y-6 transition-all motion-reduce:translate-y-0 duration-700 ease-out ${
                  isVisible
                    ? "translate-y-0 opacity-100 blur-none"
                    : "translate-y-14 opacity-35 blur-xs"
                }`}
              >
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
                {item.ctaLabel &&
                  item.ctaTo &&
                  (item.ctaLabel === "Projít návody" ? (
                    <Button
                      type="button"
                      onClick={onBrowseManualsClick}
                      className="h-20 rounded-xl px-10 text-xl font-semibold"
                    >
                      {item.ctaLabel}
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className={
                        item.ctaLabel === "Přejít na onboarding"
                          ? "h-20 rounded-xl px-10 text-xl font-semibold"
                          : "h-10 rounded-xl px-5 text-sm font-semibold"
                      }
                    >
                      <Link to={item.ctaTo}>{item.ctaLabel}</Link>
                    </Button>
                  ))}
              </div>

              {/* There must be a duplicate isVisible animation, because otherwise the backdrop-filter pops in after animation ends */}
              <div
                className={`flex h-fit rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5 flex-col justify-center transition-all motion-reduce:translate-y-0 duration-700 ease-out backdrop-blur-md ${
                  isVisible
                    ? "translate-y-0 opacity-100 blur-none"
                    : "translate-y-14 opacity-35 blur-xs"
                }`}
              >
                <div className="mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/90">
                    Souhrn a tipy
                  </p>
                </div>
                <ul className="space-y-2 text-sm leading-relaxed text-zinc-100/90 md:text-base ">
                  {item.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function HowItWorks() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"help" | "expert">("help");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const navigateToSearch = useCallback(() => {
    navigate("/search");
  }, [navigate]);

  const handleAuthSuccess = useCallback(() => {
    setAuthDialogOpen(false);
    navigateToSearch();
  }, [navigateToSearch]);

  const handleBrowseManualsClick = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        if (data.isAuthenticated) {
          navigateToSearch();
          return;
        }
      }
    } catch {
      // On network/server errors keep fallback behavior and show auth dialog.
    }

    setAuthDialogOpen(true);
  }, [navigateToSearch]);

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
    <>
      <AuthRequiredDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSuccess={handleAuthSuccess}
        message="Pro procházení návodů se nejdřív přihlaste nebo zaregistrujte."
      />

      <section
        id="jak-to-funguje"
        className="relative overflow-hidden bg-transparent py-16 md:py-24"
      >
        <div className="relative w-full">
          <div className="mx-auto mb-10 max-w-6xl px-6 text-center md:mb-12">
            <span className="mb-3 block text-[12px] font-bold tracking-[0.15em] text-primary uppercase">
              Popis aplikace
            </span>
            <h2 className="text-4xl font-black tracking-tight md:text-6xl xl:text-7xl">
              Jak to funguje?
            </h2>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "help" | "expert")}
            className="w-full items-center"
          >
            <TabsList className="mx-auto mb-8 grid max-h-14 h-14! w-full max-w-4xl grid-cols-2 items-stretch rounded-2xl border border-primary/35 bg-black/35 p-1.5 backdrop-blur-sm">
              <TabsTrigger
                value="help"
                className="h-full rounded-xl px-6 text-base font-bold text-zinc-200 transition-colors md:px-10 md:text-xl data-[state=active]:bg-white/14 data-[state=active]:text-white data-[state=active]:shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:text-zinc-50"
              >
                Potřebuji pomoc
              </TabsTrigger>
              <TabsTrigger
                value="expert"
                className="h-full rounded-xl px-6 text-base font-bold text-zinc-200 transition-colors md:px-10 md:text-xl data-[state=active]:bg-white/14 data-[state=active]:text-white data-[state=active]:shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:text-zinc-50"
              >
                Chci pomáhat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="help" className="w-full">
              <div className="w-full">
                <FlowSections
                  items={helpFlow}
                  onBrowseManualsClick={handleBrowseManualsClick}
                />
              </div>
            </TabsContent>

            <TabsContent value="expert" className="w-full">
              <div className="w-full">
                <FlowSections
                  items={expertFlow}
                  onBrowseManualsClick={handleBrowseManualsClick}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </>
  );
}
