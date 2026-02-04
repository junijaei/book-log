import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookCard } from '@/components/book-card';
import { PageHeader } from '@/components/page-header';
import { ThemeToggle } from '@/components/theme-toggle';
import { getReadingRecords } from '@/api/mock-api';
import type {
  ReadingRecord,
  ReadingRecordFilters,
  ReadingRecordSort,
  ReadingStatus,
} from '@/types';
import {
  PAGE_TITLES,
  BUTTON_LABELS,
  PLACEHOLDERS,
  MESSAGES,
  FILTER_LABELS,
  getReadingStatusLabel,
} from '@/lib/constants';

export function BookListPage() {
  const [records, setRecords] = useState<ReadingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();

  const [filters, setFilters] = useState<ReadingRecordFilters>({});
  const [sort, setSort] = useState<ReadingRecordSort>({
    field: 'updated_at',
    direction: 'desc',
  });

  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await getReadingRecords(filters, sort, {
        cursor,
        limit: 10,
      });

      setRecords(prev => (cursor ? [...prev, ...response.data] : response.data));
      setCursor(response.next_cursor || undefined);
      setHasMore(response.has_more);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  }, [cursor, filters, sort, loading, hasMore]);

  // Reset and reload when filters/sort change
  useEffect(() => {
    setRecords([]);
    setCursor(undefined);
    setHasMore(true);
  }, [filters, sort]);

  // Load initial data
  useEffect(() => {
    if (cursor === undefined && hasMore) {
      loadMore();
    }
  }, [cursor, hasMore, loadMore]);

  // Infinite scroll observer
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value || undefined }));
  };

  const handleStatusFilter = (status: ReadingStatus | 'all') => {
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? undefined : [status],
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <PageHeader
        title={PAGE_TITLES.BOOK_LIST}
        actions={
          <>
            <ThemeToggle />
            <Link to="/books/new">
              <Button>{BUTTON_LABELS.ADD_BOOK}</Button>
            </Link>
          </>
        }
      />

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <Input
          type="search"
          placeholder={PLACEHOLDERS.SEARCH}
          value={filters.search || ''}
          onChange={handleSearchChange}
          className="max-w-md"
        />

        <div className="flex gap-2 flex-wrap">
          {(['all', 'want_to_read', 'reading', 'finished', 'abandoned'] as const).map(status => (
            <Button
              key={status}
              variant={
                status === 'all'
                  ? !filters.status
                    ? 'default'
                    : 'outline'
                  : filters.status?.includes(status)
                    ? 'default'
                    : 'outline'
              }
              size="sm"
              onClick={() => handleStatusFilter(status)}
            >
              {status === 'all' ? FILTER_LABELS.ALL : getReadingStatusLabel(status)}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant={sort.field === 'updated_at' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSort({ field: 'updated_at', direction: 'desc' })}
          >
            {FILTER_LABELS.SORT_BY_UPDATED}
          </Button>
          <Button
            variant={sort.field === 'start_date' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSort({ field: 'start_date', direction: 'desc' })}
          >
            {FILTER_LABELS.SORT_BY_START_DATE}
          </Button>
          <Button
            variant={sort.field === 'end_date' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSort({ field: 'end_date', direction: 'desc' })}
          >
            {FILTER_LABELS.SORT_BY_END_DATE}
          </Button>
        </div>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {records.map(record => (
          <BookCard key={record.reading_log.id} record={record} />
        ))}
      </div>

      {loading && <div className="text-center py-8 text-muted-foreground">{MESSAGES.LOADING}</div>}

      {!loading && records.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>{MESSAGES.NO_BOOKS_FOUND}</p>
          <Link to="/books/new">
            <Button variant="outline" className="mt-4">
              {BUTTON_LABELS.ADD_FIRST_BOOK}
            </Button>
          </Link>
        </div>
      )}

      {/* Intersection observer target */}
      <div ref={observerTarget} className="h-10" />
    </div>
  );
}
