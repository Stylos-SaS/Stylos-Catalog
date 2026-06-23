import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import type { SortDirection } from "@/lib/use-table-sort";
import { cn } from "@/lib/utils";

type SortableTableHeadProps = {
  label: string;
  sortKey: string;
  activeKey: string | null;
  direction: SortDirection;
  onSort: (key: string) => void;
  align?: "left" | "right" | "center";
  className?: string;
};

export function SortableTableHead({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  align = "left",
  className,
}: SortableTableHeadProps) {
  const isActive = activeKey === sortKey;
  const ariaSort = isActive
    ? direction === "asc"
      ? "ascending"
      : "descending"
    : "none";

  const Icon = isActive
    ? direction === "asc"
      ? ChevronUp
      : ChevronDown
    : ArrowUpDown;

  return (
    <th
      className={cn(
        "px-5 py-3",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
      aria-sort={ariaSort}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 font-inherit uppercase tracking-wider transition-colors hover:text-foreground",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <Icon className={cn("h-3.5 w-3.5", !isActive && "opacity-50")} />
      </button>
    </th>
  );
}
