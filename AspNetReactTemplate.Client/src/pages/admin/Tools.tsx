"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit2,
  ExternalLink,
  Search,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTools } from "@/hooks/useTools";
import { EditModal } from "@/components/domains/admin/tools/EditModal";
import type { Tool, ToolWithManuals } from "@/types/tool";
import {
  AdminDataTable,
  AdminTableCard,
  AdminTableHead,
  AdminTablePagination,
  AdminTableStateRow,
  PAGE_SIZE,
  type AdminTableColumn,
} from "@/components/domains/admin/TableLayout";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SortBy = "name" | "url" | "manuals";
type SortDirection = "asc" | "desc";

const normalizeText = (value: string | undefined): string =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function AdminTools() {
  const { tools, loading, error, refetch } = useTools();
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleEditClick = (tool: ToolWithManuals) => {
    setSelectedTool(tool);
    setIsModalOpen(true);
  };

  const handleSort = (column: SortBy) => {
    setPage(1);

    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(column);
    setSortDirection(column === "manuals" ? "desc" : "asc");
  };

  const getSortIcon = (column: SortBy) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-2 size-4" />;
    }

    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 size-4" />
    ) : (
      <ArrowDown className="ml-2 size-4" />
    );
  };

  const columns: AdminTableColumn[] = [
    {
      key: "name",
      label: (
        <Button
          type="button"
          variant="ghost"
          className="font-bold"
          onClick={() => handleSort("name")}
        >
          Název
          {getSortIcon("name")}
        </Button>
      ),
    },
    {
      key: "url",
      label: (
        <Button
          type="button"
          variant="ghost"
          className="font-bold"
          onClick={() => handleSort("url")}
        >
          URL
          {getSortIcon("url")}
        </Button>
      ),
    },
    { key: "note", label: <span className="font-bold">Poznámka</span> },
    {
      key: "manuals",
      label: (
        <Button
          type="button"
          variant="ghost"
          className="font-bold"
          onClick={() => handleSort("manuals")}
        >
          Manuály
          {getSortIcon("manuals")}
        </Button>
      ),
      className: "w-[28%]",
    },
    {
      key: "actions",
      label: <span className="font-bold">Akce</span>,
      className: "w-20 min-w-20 whitespace-nowrap text-right pr-5",
    },
  ];

  const filteredTools = useMemo(() => {
    const keywords = normalizeText(search).split(/\s+/).filter(Boolean);

    if (keywords.length === 0) {
      return tools;
    }

    return tools.filter((tool) => {
      const searchableContent = normalizeText(
        `${tool.name} ${tool.url ?? ""} ${tool.note ?? ""} ${(tool.manuals ?? []).join(" ")}`,
      );

      return keywords.every((keyword) => searchableContent.includes(keyword));
    });
  }, [search, tools]);

  const sortedTools = useMemo(() => {
    const next = [...filteredTools];

    next.sort((a, b) => {
      if (sortBy === "name") {
        return normalizeText(a.name).localeCompare(normalizeText(b.name), "cs");
      }

      if (sortBy === "url") {
        const aHasUrl = a.url?.trim() ? 1 : 0;
        const bHasUrl = b.url?.trim() ? 1 : 0;

        if (aHasUrl !== bHasUrl) {
          return bHasUrl - aHasUrl;
        }

        return normalizeText(a.url).localeCompare(normalizeText(b.url), "cs");
      }

      const aManualsCount = a.manuals?.length ?? 0;
      const bManualsCount = b.manuals?.length ?? 0;
      return bManualsCount - aManualsCount;
    });

    if (sortDirection === "asc") {
      next.reverse();
    }

    return next;
  }, [filteredTools, sortBy, sortDirection]);

  const totalItems = sortedTools.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const normalizedPage = Math.min(Math.max(1, page), totalPages);
  const pageStart = (normalizedPage - 1) * PAGE_SIZE;
  const pagedTools = sortedTools.slice(pageStart, pageStart + PAGE_SIZE);

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

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <main className="mx-auto w-[95%] 2xl:w-[90%] px-6 py-8">
        <AdminTableCard
          id="admin-tools"
          title="Správa nástrojů"
          description="Vyhledávejte, řaďte a upravujte dostupné nástroje."
          actions={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Hledat napříč všemi sloupci..."
                  className="pl-9 pr-9"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted"
                    aria-label="Vymazat hledání"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </div>
          }
        >
          <AdminDataTable>
            <AdminTableHead columns={columns} />
            <tbody>
              {loading && (
                <AdminTableStateRow
                  colSpan={5}
                  message="Načítám nástroje..."
                  loading
                />
              )}

              {!loading && error && (
                <AdminTableStateRow
                  colSpan={5}
                  message={error}
                  className="text-destructive"
                />
              )}

              {!loading && !error && pagedTools.length === 0 && (
                <AdminTableStateRow
                  colSpan={5}
                  message="Nebyly nalezeny žádné nástroje odpovídající zadanému filtru."
                />
              )}

              {!loading &&
                !error &&
                pagedTools.map((tool, idx) => (
                  <tr
                    key={tool.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Otevřít detail nástroje ${tool.name}`}
                    className={`cursor-pointer border-b border-border transition-colors hover:bg-muted/20 last:border-0 focus:outline-none focus-visible:bg-muted/35 ${
                      idx % 2 === 0 ? "" : "bg-muted/10"
                    }`}
                    onClick={() => handleEditClick(tool)}
                  >
                    <td className="px-4 py-3 font-medium">{tool.name}</td>

                    <td className="max-w-88 px-4 py-3 text-muted-foreground">
                      {tool.url ? (
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-1 font-medium text-primary hover:underline"
                        >
                          <span className="truncate min-w-0">{tool.url}</span>
                          <ExternalLink className="size-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="opacity-50">-</span>
                      )}
                    </td>

                    <td className="max-w-80 px-4 py-3 text-muted-foreground">
                      {tool.note ? (
                        <p className="truncate italic" title={tool.note}>
                          {tool.note}
                        </p>
                      ) : (
                        <span className="opacity-50">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(tool.manuals?.length ?? 0) > 0 ? (
                          tool.manuals!.map((manual, idx) => (
                            <div key={idx}>
                              {manual.length > 30 ? (
                                <TooltipProvider>
                                  <Tooltip delayDuration={300}>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant="secondary"
                                        className="cursor-pointer font-normal transition-colors hover:bg-primary hover:text-primary-foreground"
                                        onClick={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          setSearch(manual);
                                          setPage(1);
                                        }}
                                        aria-label={manual}
                                      >
                                        {`${manual.slice(0, 30)}…`}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="max-w-sm"
                                    >
                                      <p className="text-sm wrap-break-word">
                                        {manual}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="cursor-pointer font-normal transition-colors hover:bg-primary hover:text-primary-foreground"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setSearch(manual);
                                    setPage(1);
                                  }}
                                  aria-label={manual}
                                >
                                  {manual}
                                </Badge>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-sm italic text-muted-foreground">
                            Není přidán
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(tool)}
                      >
                        <Edit2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </AdminDataTable>

          <AdminTablePagination
            page={normalizedPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
            disabled={loading}
          />

          <EditModal
            isOpen={isModalOpen}
            tool={selectedTool}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
          />
        </AdminTableCard>
      </main>
    </div>
  );
}
