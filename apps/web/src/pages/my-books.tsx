import { BookCardList } from '@/components/book-card-list';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInfiniteScroll, useReadingRecords } from '@/hooks';
import { messages } from '@/constants/messages';
import { getReadingStatusLabel } from '@/lib/constants';
import type { ReadingRecordFilters, ReadingRecordSort, ReadingStatus } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type SortField = 'updated_at' | 'start_date' | 'end_date';

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'updated_at', label: messages.books.filters.sortByUpdated },
  { value: 'start_date', label: messages.books.filters.sortByStartDate },
  { value: 'end_date', label: messages.books.filters.sortByEndDate },
];

const STATUS_OPTIONS: { value: ReadingStatus | 'all'; label: string }[] = [
  { value: 'all', label: messages.books.filters.all },
  { value: 'want_to_read', label: getReadingStatusLabel('want_to_read') },
  { value: 'reading', label: getReadingStatusLabel('reading') },
  { value: 'finished', label: getReadingStatusLabel('finished') },
  { value: 'abandoned', label: getReadingStatusLabel('abandoned') },
];

export function MyBooksPage() {
  const [filters, setFilters] = useState<ReadingRecordFilters>({ scope: 'me' });
  const [sort, setSort] = useState<ReadingRecordSort>({
    field: 'start_date',
    direction: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm || undefined }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useReadingRecords(
    filters,
    sort
  );

  const records = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data]);

  const { observerTarget } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const handleStatusChange = (value: string) => {
    const status = value as ReadingStatus | 'all';
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? undefined : [status],
    }));
  };

  const handleSortChange = (value: string) => {
    setSort({ field: value as SortField, direction: 'desc' });
  };

  const hasActiveFilters = filters.search || filters.status;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3 max-w-6xl">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">{messages.common.navigation.myBooks}</h1>
            <div className="flex gap-2 items-center">
              <Button
                variant={showFilters || hasActiveFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? '필터 닫기' : '검색/필터'}
                {hasActiveFilters && !showFilters && ' •'}
              </Button>
              <ThemeToggle />
              <Link to="/books/new">
                <Button size="sm">{messages.books.buttons.addBook}</Button>
              </Link>
            </div>
          </div>

          {showFilters && (
            <div className="mt-3 pb-1 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <Input
                type="search"
                placeholder={messages.books.placeholders.search}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Select value={filters.status?.[0] || 'all'} onValueChange={handleStatusChange}>
                  <SelectTrigger className="flex-1 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sort.field} onValueChange={handleSortChange}>
                  <SelectTrigger className="flex-1 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 max-w-6xl">
        <BookCardList
          records={records}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          observerTarget={observerTarget}
          emptyState={
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">{messages.books.messages.empty}</p>
              <Link to="/books/new">
                <Button variant="outline" size="sm" className="mt-4">
                  {messages.books.buttons.addFirstBook}
                </Button>
              </Link>
            </div>
          }
        />
      </main>
    </div>
  );
}
