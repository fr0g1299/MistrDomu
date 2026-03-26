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

// --- NOVÉ IMPORTY PRO TOOLTIP ---
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
          note: updatedTool.note, 
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
    <TooltipProvider delayDuration={300}> {/* Provider obaluje tabulku pro tooltipy */}
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Správa nástrojů</CardTitle>
            <CardDescription>
              Zde můžete upravovat existující nástroje. Editujte jméno, URL a poznámku.
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
              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {/* Sloupce jsou nyní standardní, bez resize */}
                      <TableHead>Název</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Poznámka</TableHead>
                      <TableHead>Používáno v manuálech</TableHead>
                      <TableHead className="w-20">Akce</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tools.map((tool) => (
                      <TableRow key={tool.id}>
                        <TableCell className="font-medium whitespace-nowrap">{tool.name}</TableCell>
                        <TableCell>
                          {tool.url ? (
                            <a
                              href={tool.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate block max-w-[200px]"
                              title={tool.url}
                            >
                              {tool.url}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        
                        {/* --- POZNÁMKA S TOOLTIPEM --- */}
                        <TableCell>
                          {tool.note ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {/* Text se ořízne a přidá "...", cursor se změní na otazník */}
                                <p className="text-muted-foreground italic max-w-[250px] truncate cursor-help">
                                  {tool.note}
                                </p>
                              </TooltipTrigger>
                              {/* V nápovědě se ukáže celý text */}
                              <TooltipContent side="top" className="max-w-[300px] break-words">
                                <p className="text-sm">{tool.note}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground opacity-30">-</span>
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
    </TooltipProvider>
  );
}