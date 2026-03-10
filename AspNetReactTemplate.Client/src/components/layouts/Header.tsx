// Shadcn Imports
// import { Button } from "@/components/ui/button";

import { useCallback } from "react";
import { useTheme } from "../providers/ThemeProvider";
import {
  ThemeToggleButton,
  useThemeTransition,
} from "../shared/ThemeToggleButton";

export default function Header() {
  const { setTheme, resolvedTheme } = useTheme();
  const { startTransition } = useThemeTransition();

  const handleThemeToggle = useCallback(() => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";

    startTransition(() => {
      setTheme(newTheme);
    });
  }, [resolvedTheme, setTheme, startTransition]);

  return (
    <header className="border-accent-foreground/10 dark:border-accent/10 sticky top-0 z-50 bg-background/40 p-6 shadow-xl backdrop-blur-sm md:flex-row md:items-center md:px-14">
      <div className="flex items-center justify-between mx-auto relative z-10">
        <a href="/">
          <img style={{ height: "40px" }} src="logo.svg"></img>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a
            href="#jak-to-funguje"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Jak to funguje
          </a>
          {/* <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            O nás
          </a>
          <Button
            disabled
            variant="outline"
            className="border-border bg-transparent hover:bg-accent rounded-full px-6"
          >
            Přihlásit se
          </Button> */}
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
