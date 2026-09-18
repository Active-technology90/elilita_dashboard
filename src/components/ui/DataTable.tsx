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
  textMode?: 'clamp' | 'truncate' | 'wrap' | 'nowrap';
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

type StickyOffsets = {
  second: number;
  third: number;
};

const TEXT_MODE_CLASSES: Record<
  NonNullable<Column<unknown>['textMode']>,
  string
> = {
  clamp:
    'max-w-[12rem] overflow-hidden whitespace-normal break-words [overflow-wrap:anywhere] sm:max-w-[18rem] lg:max-w-[24rem]',
  truncate:
    'max-w-[12rem] truncate sm:max-w-[18rem] lg:max-w-[24rem]',
  wrap:
    'max-w-[14rem] whitespace-normal break-words [overflow-wrap:anywhere] sm:max-w-[22rem] lg:max-w-[28rem]',
  nowrap: 'whitespace-nowrap',
};

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
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [stickyOffsets, setStickyOffsets] = useState<StickyOffsets>({
    second: 0,
    third: 0,
  });

  const effectiveStickyColumns = Math.min(stickyColumns, columns.length);

  const renderCell = (item: T, column: Column<T>, index: number) => {
    if (column.render) return column.render(item, index);

    const value = item[column.key as keyof T];
    const text = value?.toString() ?? '-';
    const textMode = column.textMode ?? 'truncate';

    return (
      <span
        className={`block min-w-0 leading-5 ${TEXT_MODE_CLASSES[textMode]}`}
        title={text}
        style={
          textMode === 'clamp'
            ? {
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
              }
            : undefined
        }
      >
        {text}
      </span>
    );
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

  useLayoutEffect(() => {
    const scrollContainer = tableScrollRef.current;

    if (!scrollContainer || effectiveStickyColumns === 0) {
      setStickyOffsets((current) =>
        current.second === 0 && current.third === 0
          ? current
          : { second: 0, third: 0 },
      );
      return;
    }

    let frameId: number | null = null;
    let active = true;

    const getHeaderCells = () =>
      Array.from(
        scrollContainer.querySelectorAll<HTMLTableCellElement>(
          'thead tr:first-child > th',
        ),
      );

    const measureStickyOffsets = () => {
      frameId = null;
      if (!active) return;

      const headerCells = getHeaderCells();
      if (headerCells.length === 0) return;

      const firstWidth =
        effectiveStickyColumns >= 2
          ? headerCells[0]?.getBoundingClientRect().width ?? 0
          : 0;
      const secondWidth =
        effectiveStickyColumns >= 3
          ? headerCells[1]?.getBoundingClientRect().width ?? 0
          : 0;

      const nextSecond =
        effectiveStickyColumns >= 2
          ? Math.round(firstWidth * 100) / 100
          : 0;
      const nextThird =
        effectiveStickyColumns >= 3
          ? Math.round((firstWidth + secondWidth) * 100) / 100
          : 0;

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

    const scheduleMeasurement = () => {
      if (!active || frameId !== null) return;
      frameId = window.requestAnimationFrame(measureStickyOffsets);
    };

    scheduleMeasurement();

    let resizeObserver: ResizeObserver | undefined;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleMeasurement);

      const headerCells = getHeaderCells();
      headerCells
        .slice(0, effectiveStickyColumns)
        .forEach((cell) => resizeObserver?.observe(cell));

      const table = scrollContainer.querySelector('table');
      if (table) resizeObserver.observe(table);

      resizeObserver.observe(scrollContainer);
    }

    window.addEventListener('resize', scheduleMeasurement, { passive: true });

    if (typeof document !== 'undefined' && document.fonts) {
      void document.fonts.ready.then(() => {
        scheduleMeasurement();
      });
    }

    return () => {
      active = false;

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleMeasurement);
    };
  }, [columns.length, effectiveStickyColumns]);

  const getStickyHeaderClass = (index: number) => {
    if (index >= effectiveStickyColumns) return '';

    if (index === 0) {
      return `
        md:sticky md:left-0 md:z-30
        bg-gray-50
      `;
    }

    if (index === 1) {
      return `
        md:sticky md:left-[var(--sticky-left-2)] md:z-30
        bg-gray-50
      `;
    }

    return `
      md:sticky md:left-[var(--sticky-left-3)] md:z-30
      bg-gray-50
      md:shadow-[8px_0_12px_-10px_rgba(15,23,42,0.28)]
    `;
  };

  const getStickyCellClass = (columnIndex: number, rowIndex: number) => {
    if (columnIndex >= effectiveStickyColumns) return '';

    const backgroundClass =
      rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50';

    if (columnIndex === 0) {
      return `
        md:sticky md:left-0 md:z-20
        ${backgroundClass}
        group-hover:bg-gray-100
      `;
    }

    if (columnIndex === 1) {
      return `
        md:sticky md:left-[var(--sticky-left-2)] md:z-20
        ${backgroundClass}
        group-hover:bg-gray-100
      `;
    }

    return `
      md:sticky md:left-[var(--sticky-left-3)] md:z-20
      ${backgroundClass}
      group-hover:bg-gray-100
      md:shadow-[8px_0_12px_-10px_rgba(15,23,42,0.28)]
    `;
  };

  const getHeaderTextClass = (index: number) =>
    index < effectiveStickyColumns
      ? 'whitespace-normal break-words [overflow-wrap:anywhere] md:whitespace-nowrap'
      : 'whitespace-nowrap';

  const getColumnKey = (column: Column<T>) =>
    column.sortKey ?? String(column.key);

  return (
    <div className="w-full max-w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm sm:rounded-xl">
      <div
        ref={tableScrollRef}
        role="region"
        aria-label="Scrollable data table"
        tabIndex={0}
        className="relative isolate max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary/40"
        style={
          {
            '--sticky-left-2': `${stickyOffsets.second}px`,
            '--sticky-left-3': `${stickyOffsets.third}px`,
          } as React.CSSProperties
        }
      >
        <table className="w-max min-w-full table-auto border-collapse text-left">
          <thead className="border-b border-secondary/10 bg-gray-50">
            <tr>
              {columns.map((column, index) => {
                const stickyClass = getStickyHeaderClass(index);
                const headerTextClass = getHeaderTextClass(index);
                const key = getColumnKey(column);

                if (
                  column.sortable &&
                  onSort &&
                  sortField !== undefined &&
                  sortOrder !== undefined
                ) {
                  return (
                    <SortableHeader
                      key={key}
                      field={column.sortKey || (column.key as string)}
                      currentSort={{ field: sortField, order: sortOrder }}
                      onSort={onSort}
                      className={`
                        px-3 py-2.5
                        text-[10px] font-semibold uppercase tracking-[0.08em]
                        text-secondary
                        sm:px-4 sm:py-3 sm:text-xs
                        ${headerTextClass}
                        ${stickyClass}
                        ${column.className || ''}
                      `}
                    >
                      {column.header}
                    </SortableHeader>
                  );
                }

                return (
                  <th
                    key={key}
                    scope="col"
                    className={`
                      px-3 py-2.5
                      text-left
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.08em]
                      text-secondary
                      sm:px-4 sm:py-3 sm:text-xs
                      ${headerTextClass}
                      ${stickyClass}
                      ${column.className || ''}
                    `}
                  >
                    {column.header}
                  </th>
                );
              })}

              {(onEdit || onDelete) && (
                <th
                  scope="col"
                  className="w-[1%] whitespace-nowrap px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-secondary sm:px-4 sm:py-3 sm:text-xs"
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              [...Array(loadingRows)].map((_, index) => (
                <SkeletonRow
                  key={`skeleton-${index}`}
                  cols={columns.length + (onEdit || onDelete ? 1 : 0)}
                />
              ))
            ) : errorMessage ? (
              <tr>
                <td
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="px-4 py-8 text-center sm:py-10"
                >
                  <p
                    role="alert"
                    className="text-sm font-medium text-red-600"
                  >
                    {errorMessage}
                  </p>

                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="mt-3 min-h-10 rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2"
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
                  className="px-4 py-8 text-center text-sm text-gray-500 sm:px-6 sm:py-10"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr
                  key={item.id ?? item.slug ?? rowIndex}
                  className="group odd:bg-white even:bg-gray-50 transition-colors duration-100 hover:bg-gray-100"
                >
                  {columns.map((column, columnIndex) => (
                    <td
                      key={getColumnKey(column)}
                      className={`
                        px-3 py-2.5
                        align-middle
                        text-xs
                        leading-5
                        text-gray-700
                        sm:px-4 sm:py-3 sm:text-sm
                        ${getStickyCellClass(columnIndex, rowIndex)}
                        ${column.className || ''}
                      `}
                    >
                      {renderCell(item, column, rowIndex)}
                    </td>
                  ))}

                  {(onEdit || onDelete) && (
                    <td className="w-[1%] whitespace-nowrap px-2 py-1.5 text-right sm:px-3 sm:py-2">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-secondary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:ring-offset-1"
                            title="Edit"
                            aria-label="Edit"
                          >
                            <Edit
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </button>
                        )}

                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:ring-offset-1"
                            title="Delete"
                            aria-label="Delete"
                          >
                            <Trash2
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
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

      {!loading &&
        !errorMessage &&
        currentPage &&
        totalPages &&
        totalPages > 1 &&
        onPageChange && (
          <div className="flex flex-col items-center justify-between gap-2 border-t border-gray-200 bg-gray-50/80 px-3 py-2.5 sm:flex-row sm:gap-4 sm:px-4 md:px-6">
            <div className="order-2 text-center text-[11px] leading-5 text-gray-500 sm:order-1 sm:text-left sm:text-xs">
              Showing{' '}
              <span className="font-medium text-gray-700">{startIndex}</span>{' '}
              to{' '}
              <span className="font-medium text-gray-700">{endIndex}</span>{' '}
              of{' '}
              <span className="font-medium text-gray-700">
                {resolvedTotalItems}
              </span>{' '}
              entries
            </div>

            <nav
              className="order-1 flex w-full items-center justify-between gap-2 sm:order-2 sm:w-auto sm:justify-end"
              aria-label="Table pagination"
            >
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-disabled={currentPage === 1}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-secondary/20 bg-white text-secondary transition-colors hover:bg-secondary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-9 sm:px-3"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>

              <span
                className="whitespace-nowrap px-2 py-1 text-xs font-semibold text-secondary sm:px-3 sm:text-sm"
                aria-live="polite"
              >
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-disabled={currentPage === totalPages}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-secondary/20 bg-white text-secondary transition-colors hover:bg-secondary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-9 sm:px-3"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </nav>
          </div>
        )}
    </div>
  );
}
