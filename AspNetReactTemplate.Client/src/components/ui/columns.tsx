import { ColumnDef } from "@tanstack/react-table";
import { ToolWithManuals } from "@/types/tool";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Edit2, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Link2, 
  Link2Off,
  Hash
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const getColumns = (onEdit: (tool: ToolWithManuals) => void): ColumnDef<ToolWithManuals>[] => [
  {
    accessorKey: "name",
    size: 100,
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting()}
          className="-ml-4 font-bold"
        >
          Název
          {!isSorted && <ArrowUpDown className="ml-2 h-4 w-4" />}
          {isSorted === "asc" && <ArrowDown className="ml-2 h-4 w-4" />}
          {isSorted === "desc" && <ArrowUp className="ml-2 h-4 w-4" />}
        </Button>
      );
    },
  },
  {
    accessorKey: "url",
    size: 125,
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting()}
          className="-ml-4 font-bold"
        >
          URL
          {isSorted === "desc" ? (
            <Link2Off className="ml-2 h-4 w-4 text-destructive" />
          ) : (
            <Link2 className={`ml-2 h-4 w-4 ${isSorted === "asc" ? "text-green-500" : ""}`} />
          )}
        </Button>
      );
    },
    sortingFn: (rowA, rowB, columnId) => {
      const a = rowA.getValue(columnId) ? 1 : 0;
      const b = rowB.getValue(columnId) ? 1 : 0;
      return b - a;
    },
    cell: ({ row }) => {
      const url = row.getValue("url") as string;
      return url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block">
          {url}
        </a>
      ) : <span className="text-muted-foreground opacity-50">-</span>;
    }
  },
  {
    accessorKey: "note",
    size: 125,
    header: () => <span className="font-bold">Poznámka</span>,
    cell: ({ row }) => {
      const note = row.getValue("note") as string;
      if (!note) return <span className="text-muted-foreground opacity-30">-</span>;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-muted-foreground italic truncate cursor-help">{note}</p>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px] break-words">
            <p className="text-sm">{note}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
  },
  {
    accessorKey: "manuals",
    sortDescFirst: true, 
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting()}
          className="-ml-4 font-bold"
          title="Seřadit podle počtu manuálů"
        >
          Manuály
          <Hash className="ml-2 h-3 w-3 opacity-50" />
          {!isSorted && <ArrowUpDown className="ml-2 h-4 w-4" />}
          {isSorted === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
          {isSorted === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
        </Button>
      );
    },
    sortingFn: (rowA, rowB, columnId) => {
      const a = (rowA.getValue(columnId) as string[])?.length || 0;
      const b = (rowB.getValue(columnId) as string[])?.length || 0;
      return a - b;
    },
    cell: ({ row, table }) => {
      const manuals = row.original.manuals || [];
      return (
        <div className="flex flex-wrap gap-1">
          {manuals.length > 0 ? (
            manuals.map((m) => (
              <Badge 
                key={m} 
                variant="secondary" 
                className="font-normal cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => table.setGlobalFilter(m)}
              >
                {m}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm italic">Není přidán</span>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="text-right">
        <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  }
];