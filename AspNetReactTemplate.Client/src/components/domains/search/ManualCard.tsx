import { Manual, Difficulty, getDifficultyLabel } from "@/types/manual";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Clock3 } from "lucide-react";

interface Props {
  manual: Manual;
}

const FALLBACK_IMAGE = "Place url in the future lol";

export const ManualCard = ({ manual }: Props) => {
  const getDifficultyColor = (diff: Difficulty) => {
    if (diff === Difficulty.Easy) return "text-green-600";
    if (diff === Difficulty.Medium) return "text-yellow-400";
    return "text-red-600";
  };

  return (
    <Link
      to={`/guide/${manual.id}`}
      state={{ manual }}
      className="block h-full"
    >
      <Card className="h-full flex flex-col bg-card/80 overflow-hidden gap-3 border-0 pt-0 shadow-none transition-transform duration-400 hover:scale-[1.02]">
        <div className="relative aspect-video w-full overflow-hidden">
          <img
            src={manual.imageUrl || FALLBACK_IMAGE}
            alt={manual.title}
            className="h-full w-full object-cover"
          />
          <div className="hidden md:block absolute inset-0 bg-linear-to-t from-card/80 via-5% via-transparent to-transparent" />
        </div>

        <CardHeader className="mb-3">
          <CardTitle className="text-lg line-clamp-2 h-14 overflow-hidden">
            {manual.title}
          </CardTitle>
          <CardDescription className="line-clamp-3">
            {manual.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto">
          <div className="flex items-center justify-between text-sm">
            <div className="flex w-auto rounded-4xl bg-primary/5">
              <span className="flex items-center p-2 px-4 gap-2">
                <Clock3 className="size-4 text-primary/80" />
                {manual.estimatedTimeMinutes} minut
              </span>
            </div>
            <span
              className={`font-semibold ${getDifficultyColor(manual.difficulty)}`}
            >
              {getDifficultyLabel(manual.difficulty)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
