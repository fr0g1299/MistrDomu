import { WrenchIcon } from "lucide-react";

// Shadcn Imports
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="border-accent-foreground/10 dark:border-accent/10 sticky top-0 z-50 bg-background/40 p-5 shadow-xl backdrop-blur-sm md:flex-row md:items-center md:px-14">
      <div className="flex items-center justify-between p-2 mx-auto relative z-10">
        {/* TODO: Maybe change Font */}
        <a
          className="flex items-center font-extrabold text-2xl tracking-tight font-['Stack_Sans_Notch']"
          href="/"
        >
          <span>M</span>
          <WrenchIcon
            className="w-5 h-5 text-primary -mx-px rotate-335"
            strokeWidth={2.5}
          />
          <span>
            str<span className="text-primary">Domu</span>
          </span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Jak to funguje
          </a>
          <a
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
          </Button>
        </div>
      </div>
    </header>
  );
}
