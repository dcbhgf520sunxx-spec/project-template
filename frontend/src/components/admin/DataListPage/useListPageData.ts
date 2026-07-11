import { useEffect, useMemo, useState } from 'react';
import type { SearchTableProps } from '../SearchTable';

type SortOrder = 'ascend' | 'descend';

type SortState = {
  field?: string;
  order?: SortOrder;
};

type UseListPageDataOptions<T extends Record<string, unknown>> = {
  rows: T[];
  sorters?: Record<string, (a: T, b: T) => number>;
  defaultPageSize?: number;
  resetOn?: unknown[];
  total?: number;
  serverPaging?: boolean;
};

type TableSorter = {
  field?: string | number | readonly (string | number)[];
  order?: SortOrder | null;
};

function normalizeSorter(sorter: unknown): SortState {
  const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
  if (!activeSorter || typeof activeSorter !== 'object') return {};

  const { field, order } = activeSorter as TableSorter;
  const normalizedField = Array.isArray(field)
    ? field.join('.')
    : field !== undefined ? String(field) : undefined;

  return order && normalizedField ? { field: normalizedField, order } : {};
}

function getStoredDefaultPageSize() {
  const fallback = 20;
  const raw = localStorage.getItem('user_preference');
  if (!raw) return fallback;

  try {
    const pageSize = Number(JSON.parse(raw)?.default_page_size || fallback);
    return [10, 20, 50, 100].includes(pageSize) ? pageSize : fallback;
  } catch {
    return fallback;
  }
}

export function useListPageData<T extends Record<string, unknown>>({
  rows,
  sorters = {},
  defaultPageSize = getStoredDefaultPageSize(),
  resetOn = [],
  total,
  serverPaging = false
}: UseListPageDataOptions<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortState, setSortState] = useState<SortState>({});

  const sortedRows = useMemo(() => {
    if (serverPaging) return rows;
    if (!sortState.field || !sortState.order) return rows;

    const sorter = sorters[sortState.field];
    if (!sorter) return rows;

    return [...rows].sort((a, b) => {
      const result = sorter(a, b);
      return sortState.order === 'ascend' ? result : -result;
    });
  }, [rows, serverPaging, sortState, sorters]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil((serverPaging ? total || 0 : sortedRows.length) / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [currentPage, pageSize, serverPaging, sortedRows.length, total]);

  const resetKey = JSON.stringify(resetOn);

  useEffect(() => {
    setCurrentPage(1);
  }, [resetKey]);

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return serverPaging ? sortedRows : sortedRows.slice(start, start + pageSize);
  }, [currentPage, pageSize, serverPaging, sortedRows]);

  const handleTableChange: NonNullable<SearchTableProps<T>['onChange']> = (_, __, sorter) => {
    setSortState(normalizeSorter(sorter));
    setCurrentPage(1);
  };

  const pagination = {
    current: currentPage,
    pageSize,
    total: serverPaging ? total || 0 : sortedRows.length,
    onChange: (page: number, size: number) => {
      setCurrentPage(page);
      setPageSize(size);
    },
    onShowSizeChange: (_: number, size: number) => {
      setCurrentPage(1);
      setPageSize(size);
    }
  };

  return {
    currentPage,
    pageSize,
    pagedRows,
    sortedRows,
    sortState,
    total: serverPaging ? total || 0 : sortedRows.length,
    pagination,
    setCurrentPage,
    setPageSize,
    setSortState,
    handleTableChange,
    renderIndex: (index: number) => (currentPage - 1) * pageSize + index + 1
  };
}
