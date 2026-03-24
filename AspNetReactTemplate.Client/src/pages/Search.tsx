import { useState } from "react";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ManualsList } from "@/components/domains/search/ManualsList";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  return (
    <section className="relative z-10 px-4 pt-4 pb-8 md:pt-5 md:pb-10">
      <button
        type="button"
        aria-label="Zpět"
        onClick={() => navigate(-1)}
        className="absolute left-2 top-3 z-20 flex h-12 w-12 items-center justify-center rounded-full text-primary transition-colors duration-300 hover:bg-zinc-200 hover:text-primary-600 dark:hover:bg-card md:left-4 md:top-4"
      >
        <ArrowLeft className="size-9" />
      </button>

      <div className="max-w-6xl mx-auto">
        <div className="mb-5">
          <h2 className="mb-2 flex items-center gap-3 text-3xl font-bold md:text-4xl">
            <BookOpen className="h-8 w-8 text-primary md:h-9 md:w-9" />
            <span>Vyhledávání v návodech</span>
          </h2>
        </div>

        <Card className="mb-8 border-border/70 bg-card/95 p-4 md:p-6">
          <label
            htmlFor="manual-search"
            className="block text-sm font-medium mb-2 text-muted-foreground"
          >
            Hledaný výraz
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
