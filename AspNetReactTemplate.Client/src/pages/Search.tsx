import { useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ManualsList } from "@/components/domains/search/ManualsList";

export default function SearchPage() {
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
            Zadejte hledaný výraz a zobrazíme návody odpovídající vašemu zadání.
          </p>
        </div>

        <Card className="mb-10 p-4 md:p-6 border-border/70 bg-card/95">
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
