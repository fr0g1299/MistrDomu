import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthRequiredDialog } from "@/components/identity/AuthRequiredDialog";

export default function HomePage() {
  const navigate = useNavigate();
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

  return (
    <>
      <AuthRequiredDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSuccess={handleAuthSuccess}
        message="Pro procházení návodů se nejdřív přihlaste nebo zaregistrujte."
      />

      {/* Hero Section */}
      {/* Removed relative, maybe looks better, maybe not */}
      <div className="min-h-[calc(100vh-76px)] pt-10 md:pt-12 pb-6 md:pb-8 px-4 flex flex-col items-center justify-start text-center">
        <div className="absolute inset-0 z-0">
          <img
            alt="Craftsman background"
            className="h-full w-full object-cover object-[center_65%] brightness-35 dark:brightness-20"
            src="/landing_page_bg.webp"
          />
        </div>
        {/* Glow */}
        <div className="absolute top-[5vh] left-1/2 -translate-x-1/2 w-[75vw] md:w-[30vw] h-[60vw] md:h-[25vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 mt-[5vh] md:mt-[6vh] flex flex-col items-center mx-auto max-w-[90vw]">
          <h1 className="text-6xl sm:text-7xl md:text-[92px] lg:text-[106px] font-black text-background dark:text-foreground tracking-tight mb-2 leading-[0.95] animate-[fadeInUp_3s_ease-out]">
            <span className="text-background dark:text-foreground">
              Staň se{" "}
            </span>
            <span className="text-primary">mistrem</span>
            <br />
            <span className="text-background dark:text-foreground">svého </span>
            <span className="text-primary">domu</span>
          </h1>

          <p className="text-3xl md:text-[38px] font-extrabold tracking-tight leading-[1.02] mb-4 animate-[fadeInUp_2.4s_ease-out]">
            <span className="text-background dark:text-foreground">
              a oprav si to{" "}
            </span>
            <span className="text-primary">sám/sama</span>
          </p>

          <p className="text-muted/90 dark:text-muted-foreground text-lg md:text-xl mb-7 max-w-2xl font-light animate-[fadeInUp_2s_ease-out]">
            Profesionální podpora pro vaše domácí projekty. Od popsání problému
            po videokonzultaci s expertem.
          </p>

          <Button
            type="button"
            size="lg"
            onClick={handleBrowseManualsClick}
            className="mt-8 md:mt-10 w-full max-w-110 h-auto rounded-3xl border-2 border-primary bg-background/90 dark:bg-zinc-900/85 text-zinc-950 dark:text-primary hover:bg-background dark:hover:bg-zinc-900 px-10 py-6 flex flex-col items-center text-center gap-1 cursor-pointer shadow-[0_0_24px_rgba(245,158,11,0.35)] dark:shadow-[0_0_20px_rgba(245,158,11,0.28)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_54px_rgba(245,158,11,0.78)] dark:hover:shadow-[0_0_44px_rgba(245,158,11,0.62)] animate-[fadeInUp_1.8s_ease-out]"
          >
            <span className="text-3xl md:text-[40px] font-semibold leading-tight text-zinc-950 dark:text-primary [text-shadow:0_2px_8px_rgba(0,0,0,0.48)] dark:[text-shadow:0_1px_6px_rgba(245,158,11,0.35)]">
              Procházet návody
            </span>
            <span className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-zinc-900 dark:text-zinc-100">
              <CircleAlert
                className="h-4 w-4 md:h-5 md:w-5"
                strokeWidth={2.25}
              />
              JEN PRO PŘIHLÁŠENÉ UŽIVATELE
            </span>
          </Button>

          <div className="mt-6 max-w-xl animate-[fadeInUp_1.5s_ease-out]">
            <p className="text-sm md:text-base text-zinc-100/85 dark:text-zinc-200/90">
              Chcete se stát expertem a pomáhat s návody?
            </p>
            <Button
              asChild
              variant="link"
              className="mt-1 h-auto p-0 text-xs md:text-sm text-primary"
            >
              <Link to="/expert-onboarding">ZJISTIT VÍCE</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
