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

export const ManualCard = ({ manual }: Props) => {
  const getDifficultyColor = (diff: Difficulty) => {
    if (diff === Difficulty.Easy) return "text-green-600";
    if (diff === Difficulty.Medium) return "text-yellow-400";
    return "text-red-600";
  };

  const logo = `${import.meta.env.BASE_URL}logo.svg`;
  const hasImage = Boolean(manual.imageUrl);
  const wrapperClass = hasImage
    ? "aspect-video w-full overflow-hidden"
    : "aspect-video w-full overflow-hidden bg-radial-[at_50%_90%] from-primary/15 to-transparent to-80% flex items-center justify-center";
  const imageClass = hasImage
    ? "h-full w-full object-cover"
    : "h-32 w-32 object-contain opacity-90";

  return (
    <Link
      to={`/guide/${manual.id}`}
      state={{ manual }}
      className="block h-full"
    >
      <Card className="h-full flex flex-col bg-card/80 overflow-hidden gap-5 border-0 pt-0 shadow-none transition-transform duration-400 hover:scale-[1.02]">
        <div className="relative">
          <div className={wrapperClass}>
            <img
              src={hasImage ? manual.imageUrl! : logo}
              alt={manual.title}
              className={imageClass}
            />
            <div className="hidden md:block absolute inset-0 bg-linear-to-t from-card/80 via-5% via-transparent to-transparent" />
          </div>
        </div>

        <CardHeader>
          <CardTitle className="line-clamp-2 h-8 overflow-hidden">
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
                <Clock3 className="size-5 text-primary/80" />
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
