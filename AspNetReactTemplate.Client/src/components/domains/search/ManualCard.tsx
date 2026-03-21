import { Manual, Difficulty } from "@/types/manual";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={
            manual.imageUrl ||
            "https://via.placeholder.com/400x250?text=No+Image"
          }
          alt={manual.title}
          className="object-cover w-full h-full"
        />
      </div>
      <CardHeader>
        <CardTitle>{manual.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {manual.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center text-sm">
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
  );
};
