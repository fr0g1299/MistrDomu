import { useState } from "react";
import { useTools } from "@/hooks/useTools";
import { EditToolModal } from "@/components/domains/tool/EditToolModal";
import { Tool, ToolWithManuals } from "@/types/tool";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ToolsManagement() {
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
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: updatedTool.name,
          url: updatedTool.url,
        }),
      });

      if (!response.ok) {
        throw new Error("Nepodařilo se uložit nástroj");
      }

      await refetch();
    } catch (err) {
      throw err instanceof Error ? err : new Error("Neznámá chyba");
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
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Správa nástrojů</CardTitle>
          <CardDescription>
            Zde můžete upravovat existující nástroje. Editujte jméno a URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
              {error}
            </div>
          )}

          {tools.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nejsou přidány žádné nástroje
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Název</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Používáno v manuálech</TableHead>
                    <TableHead className="w-20">Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.map((tool) => (
                    <TableRow key={tool.id}>
                      <TableCell className="font-medium">{tool.name}</TableCell>
                      <TableCell>
                        {tool.url ? (
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate block max-w-xs"
                            title={tool.url}
                          >
                            {tool.url}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tool.manuals && tool.manuals.length > 0 ? (
                            tool.manuals.map((manual) => (
                              <Badge key={manual} variant="secondary">
                                {manual}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Není přidán
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(tool)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <EditToolModal
        isOpen={isModalOpen}
        tool={selectedTool}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
