export default function Footer() {
  return (
    <footer className="py-8 border-t border-border/40 px-6 w-full relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        {/* TODO: Maybe change Font */}
        <div className="flex items-center font-bold text-sm tracking-tight font-['Stack_Sans_Notch']">
          <img style={{ height: "15px" }} src="/logo_small.svg"></img>
          <span className="text-muted-foreground/50 text-xs font-normal ml-3">
            © 2026
          </span>
        </div>
        {/* Maybe delete? Idk if it is needed */}
        <div className="text-[11px] text-muted-foreground/75 tracking-[0.08em]">
          AP8VT tým Žáčci
        </div>
        <div className="self-end md:self-end flex items-center gap-6 text-right tracking-[0.08em] text-muted-foreground/75">
          <a
            href="/expert-onboarding"
            className="text-[13px] text-muted-foreground/85 hover:text-muted-foreground/70 hover:underline hover:text-primary"
          >
            • Jak se stát expertem?
          </a>
        </div>
        {/* <div className="flex flex-wrap gap-6 text-xs uppercase tracking-[0.12em] text-zinc-600">
          <button className="hover:text-primary" type="button">
            O nás
          </button>
          <button className="hover:text-primary" type="button">
            Kontakt
          </button>
          <button className="hover:text-primary" type="button">
            Podmínky
          </button>
        </div> */}
      </div>
    </footer>
  );
}
