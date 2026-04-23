"use client";

import { useState } from "react";
import { useTools } from "@/hooks/useTools";
import { EditModal } from "@/components/domains/admin/tools/EditModal";
import { Tool, ToolWithManuals } from "@/types/tool";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";

// Import local table logic
import { DataTable } from "../../components/ui/data-table";
import { getColumns } from "../../components/ui/columns";

export default function AdminTools() {
  const { tools, loading, error, refetch } = useTools();
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEditClick = (tool: ToolWithManuals) => {
    setSelectedTool(tool);
    setIsModalOpen(true);
  };

  const handleSave = async (updatedTool: Tool) => {
    try {
      const response = await fetch(`/api/tools/${updatedTool.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: updatedTool.name,
          url: updatedTool.url,
          note: updatedTool.note,
        }),
      });

      if (!response.ok) throw new Error("Failed to save tool");

      // Refresh data after successful update
      await refetch();
    } catch (err) {
      throw err instanceof Error ? err : new Error("Unknown error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="container mx-auto px-4 py-5">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Správa nástrojů
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            <DataTable columns={getColumns(handleEditClick)} data={tools} />
          </CardContent>
        </Card>

        <EditModal
          isOpen={isModalOpen}
          tool={selectedTool}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      </div>
    </TooltipProvider>
  );
}
