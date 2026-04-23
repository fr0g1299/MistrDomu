import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AdminTableCardProps = {
  id?: string;
  className?: string;
  headerClassName?: string;
  title: ReactNode;
  titleClassName?: string;
  description?: ReactNode;
  descriptionClassName?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminTableCard({
  id,
  className,
  headerClassName,
  title,
  description,
  descriptionClassName,
  actions,
  children,
}: AdminTableCardProps) {
  return (
    <Card
      id={id}
      className={cn(
        "overflow-hidden border-border/70 bg-card shadow-sm",
        className,
      )}
    >
      <CardHeader className={cn("border-b border-border", headerClassName)}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className={cn(actions && "md:mr-auto")}>
            <CardTitle className={cn("text-2xl font-bold")}>{title}</CardTitle>
            {description && (
              <p
                className={cn(
                  "mt-1 text-sm text-muted-foreground",
                  descriptionClassName,
                )}
              >
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex w-full justify-end md:w-auto">{actions}</div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

type AdminDataTableProps = {
  children: ReactNode;
  className?: string;
  tableClassName?: string;
};

export type AdminTableColumn = {
  key: string;
  label: ReactNode;
  className?: string;
};

export function AdminDataTable({
  children,
  className,
  tableClassName,
}: AdminDataTableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className={cn("w-full text-sm", tableClassName)}>{children}</table>
    </div>
  );
}

type AdminTableHeadProps = {
  columns: AdminTableColumn[];
  sticky?: boolean;
  className?: string;
  rowClassName?: string;
  cellClassName?: string;
};

export function AdminTableHead({
  columns,
  sticky = false,
  className,
  rowClassName,
  cellClassName,
}: AdminTableHeadProps) {
  return (
    <thead
      className={cn(
        sticky ? "sticky top-0 z-10 bg-muted/40" : "bg-muted/40",
        className,
      )}
    >
      <tr className={cn("border-b border-border", rowClassName)}>
        {columns.map((column) => (
          <th
            key={column.key}
            className={cn(
              "px-4 py-3 text-left font-semibold text-muted-foreground",
              cellClassName,
              column.className,
            )}
          >
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

type AdminTableStateRowProps = {
  colSpan: number;
  message: ReactNode;
  loading?: boolean;
  className?: string;
};

export function AdminTableStateRow({
  colSpan,
  message,
  loading = false,
  className,
}: AdminTableStateRowProps) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={cn(
          "px-4 py-8 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            {message}
          </span>
        ) : (
          message
        )}
      </td>
    </tr>
  );
}

type AdminTablePaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
  disabled?: boolean;
  className?: string;
};

export function AdminTablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  disabled = false,
  className,
}: AdminTablePaginationProps) {
  const normalizedTotalPages = Math.max(1, totalPages || 1);
  const normalizedPage = Math.min(Math.max(1, page), normalizedTotalPages);
  const pageStart = totalItems === 0 ? 0 : (normalizedPage - 1) * pageSize + 1;
  const pageEnd = Math.min(normalizedPage * pageSize, totalItems);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border px-4 py-3 text-sm md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <span className="text-muted-foreground">
        Zobrazeno {pageStart}-{pageEnd} z {totalItems}
      </span>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, normalizedPage - 1))}
          disabled={disabled || normalizedPage <= 1}
        >
          <ChevronLeft className="size-4" />
          Předchozí
        </Button>

        <span className="min-w-24 text-center text-muted-foreground">
          Strana {normalizedPage} / {normalizedTotalPages}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onPageChange(Math.min(normalizedTotalPages, normalizedPage + 1))
          }
          disabled={disabled || normalizedPage >= normalizedTotalPages}
        >
          Další
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
