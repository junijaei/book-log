import { useEffect, useState } from 'react';

import { messages } from '@/constants/messages';
import type { ReadingRecordFilters, ReadingRecordSort, ReadingStatus } from '@/types';

export type SortField = 'updated_at' | 'start_date' | 'end_date';

export const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'updated_at', label: messages.books.filters.sortByUpdated },
  { value: 'start_date', label: messages.books.filters.sortByStartDate },
  { value: 'end_date', label: messages.books.filters.sortByEndDate },
];

export const STATUS_OPTIONS: { value: ReadingStatus | 'all'; label: string }[] = [
  { value: 'all', label: messages.books.filters.all },
  { value: 'want_to_read', label: messages.books.status.want_to_read },
  { value: 'reading', label: messages.books.status.reading },
  { value: 'finished', label: messages.books.status.finished },
  { value: 'abandoned', label: messages.books.status.abandoned },
];

export interface UseMyBooksFiltersReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: ReadingStatus | 'all';
  setStatusFilter: (status: ReadingStatus | 'all') => void;
  sortBy: ReadingRecordSort;
  setSortBy: (sort: ReadingRecordSort) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  filters: ReadingRecordFilters;
}

/**
 * Manages filter, sort, and search state for the My Books page.
 *
 * Encapsulates debounced search, status filter, sort order, and filter panel
 * visibility, and derives the `ReadingRecordFilters` query object.
 */
export function useMyBooksFilters(): UseMyBooksFiltersReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<ReadingRecordSort>({
    field: 'updated_at',
    direction: 'desc',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filters: ReadingRecordFilters = {
    scope: 'me',
    status: statusFilter === 'all' ? undefined : [statusFilter],
    search: debouncedSearch || undefined,
  };

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    isFilterOpen,
    setIsFilterOpen,
    filters,
  };
}
