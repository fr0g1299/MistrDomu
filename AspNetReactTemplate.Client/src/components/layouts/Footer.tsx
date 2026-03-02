import { Wrench/*, Twitter, Linkedin, Instagram */ } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-8 border-t border-border/40 px-6 w-full relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        {/* TODO: Maybe change Font */}
        <div className="flex items-center font-bold text-sm tracking-tight font-['Stack_Sans_Notch']">
          <span>M</span>
          <Wrench
            className="w-4 h-4 text-primary -mx-px rotate-335"
            strokeWidth={2.5}
          />
          <span>strDomu</span>
          <span className="text-muted-foreground/50 text-xs font-normal ml-3">
            © 2026
          </span>
        </div>
        {/* <div className="flex items-center gap-5">
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Twitter className="w-5 h-5" />
          </a>
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Linkedin className="w-5 h-5" />
          </a>
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Instagram className="w-5 h-5" />
          </a>
        </div> */}
      </div>
    </footer>
  );
}
