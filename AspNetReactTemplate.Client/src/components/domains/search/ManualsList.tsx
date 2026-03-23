import { useEffect, useState } from "react";
import { apiService } from "@/lib/apiService";
import { Manual } from "@/types/manual";
import { ManualCard } from "./ManualCard";
import { Loader2 } from "lucide-react";

interface Props {
  searchQuery: string;
}

export const ManualsList = ({ searchQuery }: Props) => {
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const trimmedQuery = searchQuery.trim();
  const isShortQuery = trimmedQuery.length > 0 && trimmedQuery.length < 3;

  useEffect(() => {
    if (isShortQuery) {
      setLoading(false);
      setError(null);
      setManuals([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        let data;
        if (trimmedQuery.length >= 3) {
          data = await apiService.searchManuals(trimmedQuery);
        } else {
          data = await apiService.getAllManuals();
        }
        setManuals(data);
        setError(null);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Při načítání došlo k chybě",
        );
      } finally {
        setLoading(false);
      }
    };

    // Debounce 300ms, aby se nevolalo API při každém stisku klávesy
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [trimmedQuery, isShortQuery]); // Reaguje na změnu vyhledávání

  if (loading && manuals.length === 0)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      {error && <p className="text-destructive text-center">{error}</p>}

      {isShortQuery && (
        <div className="text-center py-3 text-muted-foreground">
          Pro vyhledávání zadejte alespoň 3 znaky.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {manuals.map((m) => (
          <ManualCard key={m.id} manual={m} />
        ))}
      </div>

      {!loading &&
        !isShortQuery &&
        trimmedQuery.length >= 3 &&
        manuals.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            Pro "{trimmedQuery}" jsme nic nenašli. Zkuste jiné slovo.
          </div>
        )}
    </div>
  );
};
