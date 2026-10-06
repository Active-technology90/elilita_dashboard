// src/components/ui/TableControls.tsx
import React, { memo } from "react";
import { CustomSelect, type SelectOption } from "./CustomSelect";

interface TableControlsProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  children: React.ReactNode;
}

export const TableControls = memo(function TableControls({
  pageSize,
  onPageSizeChange,
  children,
}: TableControlsProps) {
  const pageSizeOptions: SelectOption[] = [
  { label: "5 / page", value: "5" },
  { label: "10 / page", value: "10" },
  { label: "15 / page", value: "15" },
  { label: "30 / page", value: "30" },
  { label: "60 / page", value: "60" },
    { label: "80 / page", value: "80" },
];
  return (
    <div className="flex flex-row sm:flex-row gap-3 mb-4 items-center bg-gray-50 p-2 rounded-xl border border-gray-200">
      <div className="flex-1 w-full">{children}</div>

      <div className="w-auto flex items-center gap-2  px-2 py-1 rounded-xl">
        <CustomSelect
          value={pageSize.toString()}
          onChange={(val) => onPageSizeChange(parseInt(val))}
          options={pageSizeOptions}
          placeholder="Page Size"
          className="w-24"
        />
      </div>
    </div>
  );
});