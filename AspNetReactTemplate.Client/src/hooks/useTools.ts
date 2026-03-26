import { useState, useEffect, useCallback } from "react";
import { ToolWithManuals } from "@/types/tool";

export const useTools = () => {
  const [tools, setTools] = useState<ToolWithManuals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tools", { credentials: "include" });

      if (!response.ok) {
        throw new Error("Nepodařilo se načíst seznam nástrojů.");
      }

      const data: ToolWithManuals[] = await response.json();
      setTools(data);
    } catch (err) {
      console.error("Chyba v useTools:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Neznámá chyba při komunikaci se serverem",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  return {
    tools,
    loading,
    error,
    refetch: fetchTools,
  };
};
