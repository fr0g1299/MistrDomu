// Shadcn Imports
import { Button } from "@/components/ui/button";

import { useCallback } from "react";
import { useTheme } from "../providers/ThemeProvider";
import {
  ThemeToggleButton,
  useThemeTransition,
} from "../shared/ThemeToggleButton";

type HeaderProps = {
  activeScreen: "home" | "manuals";
  onNavigateToManuals: () => void;
  onNavigateHome: () => void;
};

export default function Header({
  activeScreen,
  onNavigateToManuals,
  onNavigateHome,
}: HeaderProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const { startTransition } = useThemeTransition();

  const handleThemeToggle = useCallback(() => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";

    startTransition(() => {
      setTheme(newTheme);
    });
  }, [resolvedTheme, setTheme, startTransition]);

  return (
    <header className="border-accent-foreground/10 dark:border-accent/10 sticky top-0 z-50 bg-background/60 dark:bg-background/40 p-6 shadow-xl backdrop-blur-sm md:flex-row md:items-center md:px-14">
      <div className="flex items-center justify-between mx-auto relative z-10">
        {/* TODO: Logo looks bad in Light theme */}
        <a href="/" onClick={onNavigateHome}>
          <img style={{ height: "40px" }} src="logo.svg"></img>
        </a>
        <div className="flex items-center gap-2 md:gap-4 text-sm font-medium">
          {activeScreen === "home" && (
            <a
              href="#jak-to-funguje"
              className="hidden md:inline-flex text-muted-dark dark:text-muted-foreground hover:text-foreground transition-colors"
            >
              Jak to funguje
            </a>
          )}

          {activeScreen === "home" ? (
            <Button
              type="button"
              size="sm"
              className="rounded-full px-4"
              onClick={onNavigateToManuals}
            >
              Návody
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full px-4"
              onClick={onNavigateHome}
            >
              Zpět na úvod
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="hidden md:inline-flex rounded-full px-4"
          >
            Přihlásit/Registrovat
          </Button>

          <ThemeToggleButton
            theme={resolvedTheme}
            variant="circle-blur"
            onClick={handleThemeToggle}
            start="top-right"
          />
        </div>
      </div>
    </header>
  );
}
