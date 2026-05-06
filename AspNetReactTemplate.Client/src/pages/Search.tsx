import { useState } from "react";
import { BookOpen, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ManualsList } from "@/components/domains/search/ManualsList";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    // Also at_50% looks good
    <section className="relative bg-radial-[at_5%_90%] from-primary/3 to-primary/1 z-10 px-4 pt-4 pb-8 md:pt-10 md:pb-10 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="flex items-center justify-center gap-3 text-3xl font-bold md:text-4xl">
            <BookOpen className="h-8 w-8 text-primary md:h-9 md:w-9" />
            <span>Vyhledávání v návodech</span>
          </h2>
        </div>

        <Card className="mb-8 border-border/40 bg-card/10 p-4 md:p-6">
          {/* TODO: If this is good change, then remove */}
          {/* <label
            htmlFor="manual-search"
            className="block text-sm font-medium mb-2 text-muted-foreground"
          >
            Hledaný výraz
          </label> */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="manual-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Např. pračka, zásuvka, sifon..."
              className="pl-10 h-11 selection:bg-primary! selection:text-primary-foreground!"
            />
          </div>
        </Card>

        <ManualsList searchQuery={searchQuery} />
      </div>
    </section>
  );
}
