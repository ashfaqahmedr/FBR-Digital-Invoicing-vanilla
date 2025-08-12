import React, { useEffect, useMemo, useRef } from 'react';
import { Button, Select, SelectItem } from '@heroui/react';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  widthClassName?: string;
  cell: (row: T) => React.ReactNode;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  totalCount?: number;
  isLoading?: boolean;
  filterBar?: React.ReactNode;
  emptyMessage?: string;
  className?: string;
  // Pagination
  pagination?: PaginationState;
  // Infinite scroll
  infiniteScroll?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function DataTable<T extends { id: string }>(props: DataTableProps<T>) {
  const {
    columns,
    data,
    totalCount,
    isLoading,
    filterBar,
    emptyMessage = 'No records found.',
    className = '',
    pagination,
    infiniteScroll = false,
    onLoadMore,
    hasMore = false,
  } = props;

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!infiniteScroll || !onLoadMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      });
    }, { rootMargin: '200px' });

    io.observe(el);
    return () => io.disconnect();
  }, [infiniteScroll, onLoadMore, hasMore, isLoading]);

  const pageFrom = useMemo(() => {
    if (!pagination) return 0;
    return (pagination.page - 1) * pagination.pageSize + 1;
  }, [pagination]);
  const pageTo = useMemo(() => {
    if (!pagination) return 0;
    const to = pagination.page * pagination.pageSize;
    return totalCount ? Math.min(to, totalCount) : to;
  }, [pagination, totalCount]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Filters */}
      {(filterBar || totalCount !== undefined) && (
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          {filterBar}
          {totalCount !== undefined && (
            <div className="text-xs text-gray-500 dark:text-gray-400">Total: {totalCount.toLocaleString()}</div>
          )}
        </div>
      )}

      {/* Table */}
      {data.length === 0 && !isLoading ? (
        <div className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {columns.map((col) => (
                  <th key={col.id} className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 ${col.widthClassName || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  {columns.map((col) => (
                    <td key={col.id} className={`px-4 py-3 align-top text-sm ${col.widthClassName || ''}`}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {infiniteScroll && <div ref={sentinelRef} className="h-1" />}

      {/* Pagination controls */}
      {!infiniteScroll && pagination && (
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {totalCount !== undefined ? (
              <>Showing {pageFrom}-{pageTo} of {totalCount.toLocaleString()}</>
            ) : (
              <>Page {pagination.page}</>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Rows:</span>
              <Select
                size="sm"
                selectedKeys={new Set([String(pagination.pageSize)])}
                onChange={(e) => pagination.onPageSizeChange(Number((e.target as HTMLSelectElement).value))}
                className="w-24"
              >
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={String(n)} value={String(n)}>{n}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="flat" isDisabled={pagination.page <= 1} onPress={() => pagination.onPageChange(pagination.page - 1)}>Prev</Button>
              <Button size="sm" variant="flat" onPress={() => pagination.onPageChange(pagination.page + 1)}>Next</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}