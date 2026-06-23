import { useCallback, useMemo, useState } from "react";
import { parseAppDate } from "./timezone";

export type SortDirection = "asc" | "desc";

export type TableSortState = {
  key: string | null;
  direction: SortDirection;
};

export type SortValueType = "string" | "number" | "boolean" | "date" | "enum";

export type SortAccessor<T> = {
  getValue: (item: T) => string | number | boolean;
  type: SortValueType;
  /** Required when type is "enum". Lower index sorts first in ascending order. */
  enumOrder?: readonly string[];
  /** Optional secondary sort when primary values tie. */
  tieBreaker?: SortAccessor<T>;
};

export type SortAccessors<T> = Record<string, SortAccessor<T>>;

function compareValues(
  a: string | number | boolean,
  b: string | number | boolean,
  type: SortValueType,
  direction: SortDirection,
  enumOrder?: readonly string[],
): number {
  let result = 0;

  switch (type) {
    case "number":
      result = (a as number) - (b as number);
      break;
    case "boolean":
      result = Number(a as boolean) - Number(b as boolean);
      break;
    case "date":
      result =
        parseAppDate(String(a)).getTime() - parseAppDate(String(b)).getTime();
      break;
    case "enum": {
      const order = enumOrder ?? [];
      result = order.indexOf(String(a)) - order.indexOf(String(b));
      break;
    }
    default:
      result = String(a).localeCompare(String(b), "es-CO", { sensitivity: "base" });
  }

  return direction === "asc" ? result : -result;
}

export function sortItems<T>(
  items: T[],
  sort: TableSortState,
  accessors: SortAccessors<T>,
): T[] {
  if (!sort.key) return items;

  const accessor = accessors[sort.key];
  if (!accessor) return items;

  return [...items].sort((left, right) => {
    const primary = compareValues(
      accessor.getValue(left),
      accessor.getValue(right),
      accessor.type,
      sort.direction,
      accessor.enumOrder,
    );

    if (primary !== 0 || !accessor.tieBreaker) return primary;

    const tie = accessor.tieBreaker;
    return compareValues(
      tie.getValue(left),
      tie.getValue(right),
      tie.type,
      sort.direction,
      tie.enumOrder,
    );
  });
}

export function useTableSort(defaultKey: string | null = null, defaultDirection: SortDirection = "asc") {
  const [sort, setSort] = useState<TableSortState>({
    key: defaultKey,
    direction: defaultDirection,
  });

  const toggleSort = useCallback((key: string) => {
    setSort((current) => {
      if (current.key !== key) {
        return { key, direction: "asc" };
      }
      return { key, direction: current.direction === "asc" ? "desc" : "asc" };
    });
  }, []);

  return { sort, toggleSort };
}

export function useSortedItems<T>(
  items: T[],
  accessors: SortAccessors<T>,
  defaultKey: string | null = null,
  defaultDirection: SortDirection = "asc",
) {
  const { sort, toggleSort } = useTableSort(defaultKey, defaultDirection);
  const sortedItems = useMemo(
    () => sortItems(items, sort, accessors),
    [items, sort, accessors],
  );

  return { sort, toggleSort, sortedItems };
}

/** Extract numeric order id from labels like SV-00012. */
export function parseOrderNumber(value: string): number {
  const match = /(\d+)/.exec(value);
  return match ? Number.parseInt(match[1]!, 10) : 0;
}
