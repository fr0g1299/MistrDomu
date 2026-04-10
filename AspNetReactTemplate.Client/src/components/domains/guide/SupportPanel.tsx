import { Video } from "lucide-react";
import { Link } from "react-router-dom";

import { AiAssistantCard } from "@/components/domains/guide/AiAssistantCard";
import { Button } from "@/components/ui/button";

type GuideSupportPanelProps = {
  manualId: number;
};

export function SupportPanel({ manualId }: GuideSupportPanelProps) {
  return (
    <aside className="hidden h-fit max-h-[90vh] flex-col gap-4 lg:sticky lg:top-24 lg:col-span-9 xl:col-span-7 lg:flex">
      {/* TODO: Update link */}
      <Link to="/todo" className="w-full">
        <Button
          type="button"
          aria-label="Potřebujete pomoc? Zavolat odborníkovi přes videohovor"
          className="w-full rounded-lg border border-primary/30 bg-primary/10 py-10 flex-col gap-1 font-semibold hover:bg-primary/13 text-primary-600 hover:text-primary transition-colors duration-200"
        >
          <span className="text-lg items-center justify-center gap-2 flex">
            <Video className="size-5" /> Potřebujete pomoc?
          </span>
          <p className="text-sm text-muted-foreground">
            Zavolat odborníkovi přes videohovor
          </p>
        </Button>
      </Link>

      {/* TODO: Right now this fetches even on small screens, where it still isn't even displayed,
                maybe add media query hook, so it lazy loads (and Suspense) */}
      <AiAssistantCard manualId={manualId} />
    </aside>
  );
}
