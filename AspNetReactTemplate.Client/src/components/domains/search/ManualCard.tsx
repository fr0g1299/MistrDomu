import { Manual, Difficulty } from "@/types/manual";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";

interface Props {
  manual: Manual;
}

export const ManualCard = ({ manual }: Props) => {
  const getDifficultyColor = (diff: Difficulty) => {
    if (diff === Difficulty.Easy) return "text-green-600";
    if (diff === Difficulty.Medium) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <Link to={`/guide/${manual.id}`} state={{ manual }} className="block">
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={
              manual.imageUrl ||
              "https://via.placeholder.com/400x250?text=No+Image"
            }
            alt={manual.title}
            className="h-full w-full object-cover"
          />
        </div>
        <CardHeader>
          <CardTitle>{manual.title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {manual.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              {manual.estimatedTimeMinutes} min
            </span>
            <span
              className={`font-semibold ${getDifficultyColor(manual.difficulty)}`}
            >
              {Difficulty[manual.difficulty]}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
