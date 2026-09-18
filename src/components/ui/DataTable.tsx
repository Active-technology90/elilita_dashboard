import React, { useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { SkeletonRow } from './SkeletonRow';
import { SortableHeader } from './SortableHeader';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortKey?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

export function DataTable<T extends { id?: number | string; slug?: string }>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data found',
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
  sortField,
  sortOrder,
  onSort,
}: DataTableProps<T>) {
  const renderCell = (item: T, column: Column<T>) => {
    if (column.render) return column.render(item);
    const value = item[column.key as keyof T];
    return value?.toString() ?? '-';
  };

  const startIndex = currentPage ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endIndex = currentPage
    ? Math.min(currentPage * itemsPerPage, totalItems || data.length)
    : data.length;

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [stickyOffsets, setStickyOffsets] = useState({
    second: 0,
    third: 0,
  });

  /*
   * Keep the first 3 columns sticky without forcing their widths.
   *
   * The browser is allowed to size every column naturally/responsively.
   * We only measure the first two rendered header widths so we know where
   * columns 2 and 3 should stick during horizontal scrolling.
   */
  useLayoutEffect(() => {
    const scrollContainer = tableScrollRef.current;
    if (!scrollContainer) return;

    const getHeaderCells = () =>
      Array.from(
        scrollContainer.querySelectorAll<HTMLTableCellElement>(
          'thead tr:first-child > th'
        )
      );

    const updateStickyOffsets = () => {
      const headerCells = getHeaderCells();
      if (headerCells.length < 3) return;

      const firstWidth = headerCells[0].getBoundingClientRect().width;
      const secondWidth = headerCells[1].getBoundingClientRect().width;

      const nextSecond = Math.round(firstWidth * 100) / 100;
      const nextThird = Math.round((firstWidth + secondWidth) * 100) / 100;

      setStickyOffsets((current) => {
        if (
          current.second === nextSecond &&
          current.third === nextThird
        ) {
          return current;
        }

        return {
          second: nextSecond,
          third: nextThird,
        };
      });
    };

    updateStickyOffsets();

    let resizeObserver: ResizeObserver | undefined;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateStickyOffsets);

      const headerCells = getHeaderCells();
      headerCells.slice(0, 3).forEach((cell) => {
        resizeObserver?.observe(cell);
      });

      resizeObserver.observe(scrollContainer);
    }

    window.addEventListener('resize', updateStickyOffsets);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateStickyOffsets);
    };
  }, [columns.length]);

  const getStickyHeaderClass = (index: number) => {
    if (index === 0) {
      return `
        sticky left-0 z-30
        bg-gray-50
      `;
    }

    if (index === 1) {
      return `
        sticky left-[var(--sticky-left-2)] z-30
        bg-gray-50
      `;
    }

    if (index === 2) {
      return `
        sticky left-[var(--sticky-left-3)] z-30
        bg-gray-50
        shadow-[8px_0_12px_-10px_rgba(0,0,0,0.35)]
      `;
    }

    return '';
  };

  const getStickyCellClass = (index: number) => {
    if (index === 0) {
      return `
        sticky left-0 z-20
        bg-white
        group-hover:bg-gray-50
      `;
    }

    if (index === 1) {
      return `
        sticky left-[var(--sticky-left-2)] z-20
        bg-white
        group-hover:bg-gray-50
      `;
    }

    if (index === 2) {
      return `
        sticky left-[var(--sticky-left-3)] z-20
        bg-white
        group-hover:bg-gray-50
        shadow-[8px_0_12px_-10px_rgba(0,0,0,0.35)]
      `;
    }

    return '';
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div
        ref={tableScrollRef}
        className="relative isolate overflow-x-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300"
        style={
          {
            '--sticky-left-2': `${stickyOffsets.second}px`,
            '--sticky-left-3': `${stickyOffsets.third}px`,
          } as React.CSSProperties
        }
      >
        <table className="w-max min-w-full table-auto divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-50/80">
            <tr>
              {columns.map((col, idx) => {
                const stickyClass = getStickyHeaderClass(idx);

                if (
                  col.sortable &&
                  onSort &&
                  sortField !== undefined &&
                  sortOrder !== undefined
                ) {
                  return (
                    <SortableHeader
                      key={idx}
                      field={col.sortKey || (col.key as string)}
                      currentSort={{ field: sortField, order: sortOrder }}
                      onSort={onSort}
                      className={`${stickyClass} ${col.className || ''}`}
                    >
                      {col.header}
                    </SortableHeader>
                  );
                }

                return (
                  <th
                    key={idx}
                    className={`
                      px-2 py-2
                      text-left
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-gray-600
                      whitespace-nowrap
                      sm:px-3 sm:text-xs
                      md:px-4 md:text-sm
                      ${stickyClass}
                      ${col.className || ''}
                    `}
                  >
                    {col.header}
                  </th>
                );
              })}

              {(onEdit || onDelete) && (
                <th className="px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-600 whitespace-nowrap sm:px-3 sm:text-xs md:px-4 md:text-sm">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <SkeletonRow
                  key={i}
                  cols={columns.length + (onEdit || onDelete ? 1 : 0)}
                />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="px-4 py-12 text-center text-sm text-gray-400 sm:px-6 sm:text-base"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={item.id ?? idx}
                  className="group transition-colors duration-150 hover:bg-gray-50/80"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`
                        break-words
                        px-2 py-2
                        align-middle
                        text-xs
                        text-gray-700
                        sm:px-3 sm:text-sm
                        md:px-4
                        ${getStickyCellClass(colIdx)}
                        ${col.className || ''}
                      `}
                    >
                      {renderCell(item, col)}
                    </td>
                  ))}

                  {(onEdit || onDelete) && (
                    <td className="px-2 py-2 text-right whitespace-nowrap sm:px-3 md:px-4">
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="rounded-lg p-1.5 text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 active:scale-95 sm:p-1"
                            title="Edit"
                            aria-label="Edit"
                          >
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        )}

                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="rounded-lg p-1.5 text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500/40 active:scale-95 sm:p-1"
                            title="Delete"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - fully responsive */}
      {!loading && totalPages && totalPages > 1 && onPageChange && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 bg-gray-50/80 px-3 py-3 sm:flex-row sm:gap-4 sm:px-4 sm:py-3 md:px-6">
          <div className="order-2 text-[11px] text-gray-500 sm:order-1 sm:text-xs md:text-sm">
            Showing{' '}
            <span className="font-medium text-gray-700">{startIndex}</span> to{' '}
            <span className="font-medium text-gray-700">{endIndex}</span> of{' '}
            <span className="font-medium text-gray-700">
              {totalItems ?? data.length}
            </span>{' '}
            entries
          </div>

          <div className="order-1 flex gap-1 sm:order-2 sm:gap-2">
            <button
              type="button"
              onClick={() => onPageChange(currentPage! - 1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-300 p-1.5 transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:py-1.5"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-2 py-1 text-xs font-medium text-gray-700 sm:px-3 sm:py-1.5 sm:text-sm">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => onPageChange(currentPage! + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-300 p-1.5 transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:py-1.5"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
