import { useState, useMemo } from "react";

export function useSorting<T>(
  items: T[],
  defaultField: keyof T | string = "created_at",
  defaultOrder: "asc" | "desc" = "desc"
) {
  const [sortField, setSortField] = useState<string>(defaultField as string);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultOrder);

  const sortedItems = useMemo(() => {
    const sorted = [...items];

    sorted.sort((a, b) => {
      let aVal: any = a[sortField as keyof T];
      let bVal: any = b[sortField as keyof T];

      // Handle nested fields
      if (sortField.includes(".")) {
        const parts = sortField.split(".");
        aVal = (a as any)[parts[0]]?.[parts[1]];
        bVal = (b as any)[parts[0]]?.[parts[1]];
      }

      // Handle dates
      if (sortField === "created_at") {
        const aDate = new Date(aVal).getTime();
        const bDate = new Date(bVal).getTime();

        const aTime = Number.isNaN(aDate) ? 0 : aDate;
        const bTime = Number.isNaN(bDate) ? 0 : bDate;

        return sortOrder === "asc"
          ? aTime - bTime
          : bTime - aTime;
      }

      // Detect numeric values
      const aNum = Number(aVal);
      const bNum = Number(bVal);

      const isNumeric =
        aVal !== null &&
        aVal !== undefined &&
        aVal !== "" &&
        bVal !== null &&
        bVal !== undefined &&
        bVal !== "" &&
        !Number.isNaN(aNum) &&
        !Number.isNaN(bNum);

      let comparison: number;

      if (isNumeric) {
        comparison = aNum - bNum;
      } else {
        const aStr = String(aVal ?? "").toLowerCase();
        const bStr = String(bVal ?? "").toLowerCase();

        comparison = aStr.localeCompare(bStr);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [items, sortField, sortOrder]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((previous) =>
        previous === "asc" ? "desc" : "asc"
      );
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return {
    sortField,
    sortOrder,
    sortedItems,
    handleSort,
  };
}