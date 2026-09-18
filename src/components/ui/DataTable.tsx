import React, { useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { SkeletonRow } from './SkeletonRow';
import { SortableHeader } from './SortableHeader';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
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
  stickyColumns?: 0 | 1 | 2 | 3;
  loadingRows?: number;
  errorMessage?: string | null;
  onRetry?: () => void;
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
  stickyColumns = 3,
  loadingRows = 5,
  errorMessage = null,
  onRetry,
}: DataTableProps<T>) {
  const renderCell = (item: T, column: Column<T>, index: number) => {
    if (column.render) return column.render(item, index);
    const value = item[column.key as keyof T];
    return value?.toString() ?? '-';
  };

  const resolvedTotalItems = totalItems ?? data.length;
  const startIndex =
    resolvedTotalItems === 0
      ? 0
      : currentPage
        ? (currentPage - 1) * itemsPerPage + 1
        : 1;
  const endIndex = currentPage
    ? Math.min(currentPage * itemsPerPage, resolvedTotalItems)
    : data.length;

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [stickyOffsets, setStickyOffsets] = useState({
    second: 0,
    third: 0,
  });

  /*
   * Sticky columns are enabled from the md breakpoint upward.
   * On mobile, the table scrolls naturally without frozen columns.
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
      const isDesktopTable = window.matchMedia('(min-width: 768px)').matches;

      if (!isDesktopTable) {
        setStickyOffsets({ second: 0, third: 0 });
        return;
      }

      const headerCells = getHeaderCells();
      if (headerCells.length === 0) return;

      const firstWidth = headerCells[0]?.getBoundingClientRect().width ?? 0;
      const secondWidth = headerCells[1]?.getBoundingClientRect().width ?? 0;

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
  }, [columns.length, stickyColumns]);

  const getStickyHeaderClass = (index: number) => {
    if (index >= stickyColumns) return '';

    if (index === 0) {
      return `
        md:sticky md:left-0 md:z-30
        md:bg-secondary/5
      `;
    }

    if (index === 1) {
      return `
        md:sticky md:left-[var(--sticky-left-2)] md:z-30
        md:bg-secondary/5
      `;
    }

    if (index === 2) {
      return `
        md:sticky md:left-[var(--sticky-left-3)] md:z-30
        md:bg-secondary/5
        md:shadow-[8px_0_12px_-10px_rgba(0,0,0,0.22)]
      `;
    }

    return '';
  };

  const getStickyCellClass = (index: number) => {
    if (index >= stickyColumns) return '';

    if (index === 0) {
      return `
        md:sticky md:left-0 md:z-20
        md:bg-white
        md:group-hover:bg-gray-50
      `;
    }

    if (index === 1) {
      return `
        md:sticky md:left-[var(--sticky-left-2)] md:z-20
        md:bg-white
        md:group-hover:bg-gray-50
      `;
    }

    if (index === 2) {
      return `
        md:sticky md:left-[var(--sticky-left-3)] md:z-20
        md:bg-white
        md:group-hover:bg-gray-50
        md:shadow-[8px_0_12px_-10px_rgba(0,0,0,0.22)]
      `;
    }

    return '';
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm sm:rounded-xl">
      <div
        ref={tableScrollRef}
        className="relative isolate overflow-x-auto overscroll-x-contain scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300"
        style={
          {
            '--sticky-left-2': `${stickyOffsets.second}px`,
            '--sticky-left-3': `${stickyOffsets.third}px`,
          } as React.CSSProperties
        }
      >
        <table className="w-max min-w-full table-auto divide-y divide-gray-200">
          <thead className="border-b border-secondary/10 bg-secondary/5">
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
                      className={`text-secondary ${stickyClass} ${col.className || ''}`}
                    >
                      {col.header}
                    </SortableHeader>
                  );
                }

                return (
                  <th
                    key={idx}
                    className={`
                      px-3 py-2.5
                      text-left
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.08em]
                      text-secondary
                      whitespace-nowrap
                      sm:px-4 sm:py-3 sm:text-xs
                      md:text-sm
                      ${stickyClass}
                      ${col.className || ''}
                    `}
                  >
                    {col.header}
                  </th>
                );
              })}

              {(onEdit || onDelete) && (
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-secondary whitespace-nowrap sm:px-4 sm:py-3 sm:text-xs md:text-sm">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              [...Array(loadingRows)].map((_, i) => (
                <SkeletonRow
                  key={i}
                  cols={columns.length + (onEdit || onDelete ? 1 : 0)}
                />
              ))
            ) : errorMessage ? (
              <tr>
                <td
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="px-4 py-12 text-center"
                >
                  <p className="text-sm font-medium text-red-600">{errorMessage}</p>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="mt-3 rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-white transition hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
                    >
                      Retry
                    </button>
                  )}
                </td>
              </tr>
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
                  className="group transition-colors duration-150 odd:bg-white even:bg-gray-50/30 hover:bg-secondary/[0.035]"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`
                        break-words
                        px-3 py-2.5
                        align-middle
                        text-xs
                        text-gray-700
                        sm:px-4 sm:py-3 sm:text-sm
                        ${getStickyCellClass(colIdx)}
                        ${col.className || ''}
                      `}
                    >
                      {renderCell(item, col, idx)}
                    </td>
                  ))}

                  {(onEdit || onDelete) && (
                    <td className="px-3 py-2.5 text-right whitespace-nowrap sm:px-4 sm:py-3">
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="rounded-lg p-1.5 text-secondary transition-all duration-200 hover:bg-secondary/10 hover:text-secondary/80 focus:outline-none focus:ring-2 focus:ring-secondary/30 active:scale-95"
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
      {!loading &&
        !errorMessage &&
        currentPage &&
        totalPages &&
        totalPages > 1 &&
        onPageChange && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 bg-gray-50/70 px-3 py-3 sm:flex-row sm:gap-4 sm:px-4 md:px-6">
          <div className="order-2 text-center text-[11px] text-gray-500 sm:order-1 sm:text-left sm:text-xs md:text-sm">
            Showing{' '}
            <span className="font-medium text-gray-700">{startIndex}</span> to{' '}
            <span className="font-medium text-gray-700">{endIndex}</span> of{' '}
            <span className="font-medium text-gray-700">
              {resolvedTotalItems}
            </span>{' '}
            entries
          </div>

          <div className="order-1 flex w-full items-center justify-between gap-2 sm:order-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={() => onPageChange(currentPage! - 1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-secondary/20 bg-white p-2 text-secondary transition-all duration-200 hover:bg-secondary/5 focus:outline-none focus:ring-2 focus:ring-secondary/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:py-1.5"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-2 py-1 text-xs font-semibold text-secondary sm:px-3 sm:py-1.5 sm:text-sm">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => onPageChange(currentPage! + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-secondary/20 bg-white p-2 text-secondary transition-all duration-200 hover:bg-secondary/5 focus:outline-none focus:ring-2 focus:ring-secondary/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:py-1.5"
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
