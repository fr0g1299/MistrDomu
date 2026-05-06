import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AuthRequiredDialog } from "@/components/identity/AuthRequiredDialog";
import { apiService } from "@/lib/apiService";
import MyRoleRequestCreate from "./MyRoleRequestCreate";

export default function ExpertOnboardingPage() {
  const { isAuthenticated, isExpert, isAdmin } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);
  const [hasRejectedRequest, setHasRejectedRequest] = useState(false);
  const [isCheckingRejectedStatus, setIsCheckingRejectedStatus] =
    useState(false);

  const loadRejectedRequestStatus = useCallback(async () => {
    if (!isAuthenticated || isExpert || isAdmin) {
      setHasRejectedRequest(false);
      setIsCheckingRejectedStatus(false);
      return false;
    }

    setIsCheckingRejectedStatus(true);

    try {
      const result = await apiService.getMyRoleRequests({
        page: 1,
        pageSize: 1,
        status: "rejected",
      });

      const rejected = result.totalItems > 0;
      setHasRejectedRequest(rejected);
      return rejected;
    } catch {
      return false;
    } finally {
      setIsCheckingRejectedStatus(false);
    }
  }, [isAdmin, isAuthenticated, isExpert]);

  useEffect(() => {
    void loadRejectedRequestStatus();
  }, [loadRejectedRequestStatus]);

  const handleCreateRequestClick = useCallback(() => {
    if (!isAuthenticated) {
      setAuthDialogOpen(true);
      return;
    }

    if (hasRejectedRequest || isCheckingRejectedStatus) {
      return;
    }

    setCreateRequestOpen(true);
  }, [hasRejectedRequest, isAuthenticated, isCheckingRejectedStatus]);

  const handleAuthSuccess = useCallback(async () => {
    setAuthDialogOpen(false);

    const rejected = await loadRejectedRequestStatus();
    if (rejected) {
      return;
    }

    setCreateRequestOpen(true);
  }, [loadRejectedRequestStatus]);

  return (
    <>
      <AuthRequiredDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSuccess={handleAuthSuccess}
        message="Pro vytvoření žádosti o roli Expert se nejdřív přihlaste nebo zaregistrujte."
      />

      {createRequestOpen && (
        <MyRoleRequestCreate
          open={createRequestOpen}
          onOpenChange={setCreateRequestOpen}
          showCloseButton={true}
        />
      )}

      <div className="relative min-h-[calc(100vh-76px)] pt-10 md:pt-12 pb-8 px-4 flex flex-col items-center justify-start text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            alt="Craftsman background"
            className="h-full w-full object-cover object-[center_65%] brightness-35 dark:brightness-20"
            src="/landing_page_bg.webp"
          />
        </div>

        <div className="absolute top-[5vh] left-1/2 -translate-x-1/2 w-[75vw] md:w-[30vw] h-[60vw] md:h-[25vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <section className="relative z-10 mt-[2vh] md:mt-[3vh] w-full max-w-5xl rounded-3xl border border-white/10 bg-black/35 px-6 py-8 md:px-9 md:py-10 shadow-[0_25px_65px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-primary animate-[fadeInUp_2.7s_ease-out]">
            Expert Onboarding
          </p>

          <h1 className="mt-2 text-3xl md:text-5xl font-black tracking-tight leading-tight text-white animate-[fadeInUp_2.3s_ease-out]">
            Staň se expertem
            <span className="block text-primary">a pomáhej ostatním</span>
          </h1>

          {/*
        <p className="mt-2 text-sm md:text-base text-primary/95 max-w-2xl mx-auto font-medium animate-[fadeInUp_1.9s_ease-out]">
        Proměňte svoje know-how na přivýdělek, který zvládnete vedle školy i práce.
        </p>
        */}

          <div className="mt-6 grid gap-4 md:grid-cols-2 text-left">
            <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-4 animate-[fadeInUp_1.8s_ease-out]">
              <h2 className="text-sm md:text-base font-semibold text-primary">
                Info o expertovi
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-100/90 marker:text-primary">
                <li>
                  V detailu návodu se můžete zapsat nebo odepsat jako pomocník.
                </li>
                <li>
                  Ve Správa &gt; Mé návody si budete moct vybrat, u kterých
                  návodů chcete pomáhat.
                </li>
                <li>
                  U svých přiřazených návodů se dá své zapojení kdykoliv změnit.
                </li>
                <li>
                  Možnost zapnou aktivní režim, kdy budete dostupní pro pomoc u
                  přiřazených návodů.
                </li>
              </ul>

              <Button
                asChild
                variant="outline"
                className="mt-4 border-primary/45 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
              >
                <Link to="/?flow=expert#jak-to-funguje">CHCI VÍCE INFA</Link>
              </Button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 animate-[fadeInUp_1.7s_ease-out]">
              <h2 className="text-sm md:text-base font-semibold text-primary">
                Postup, jak zažádat o roli
              </h2>
              <ol className="mt-3 space-y-2 text-sm text-zinc-100/90">
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                    1
                  </span>
                  <span>Klikněte na tlačítko "Vytvořit žádost" níže.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                    2
                  </span>
                  <span>Vyplňte krátké odůvodnění a odešlete žádost.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                    3
                  </span>
                  <span>
                    Po schválení administrátorem vám budou zpřístupněné expertní
                    funkce.
                  </span>
                </li>
              </ol>

              <p className="mt-3 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
                Poznámka: Pokud bude žádost zamítnuta, další žádost o roli
                Expert už nebude možné podat.
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm md:text-base text-zinc-100/85 max-w-3xl mx-auto animate-[fadeInUp_2s_ease-out]">
            Po schválení žádosti získáte roli Expert a možnost zapojit se jako
            pomocník u konkrétních návodů.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row animate-[fadeInUp_1.4s_ease-out]">
            <Button
              asChild
              variant="outline"
              className="border-white/30 bg-black/35 text-white hover:bg-black/55 hover:text-white"
            >
              <Link to="/">
                <ArrowLeft className="size-4" />
                Zpět na hlavní stránku
              </Link>
            </Button>

            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 selection:text-black!"
              onClick={handleCreateRequestClick}
              disabled={
                isExpert ||
                isAdmin ||
                hasRejectedRequest ||
                isCheckingRejectedStatus
              }
              title={
                isAdmin
                  ? "Admin nemůže žádat o roli Expert"
                  : isExpert
                    ? "Již máte roli Expert"
                    : hasRejectedRequest
                      ? "Žádost už byla jednou zamítnuta"
                      : isCheckingRejectedStatus
                        ? "Ověřuji možnost podání žádosti"
                        : ""
              }
            >
              <FileText className="size-4" />
              {isAdmin
                ? "Admin nemůže žádat o roli"
                : isExpert
                  ? "Již máte roli Expert"
                  : hasRejectedRequest
                    ? "Žádost byla zamítnuta"
                    : isCheckingRejectedStatus
                      ? "Ověřuji..."
                      : "Vytvořit žádost"}
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
