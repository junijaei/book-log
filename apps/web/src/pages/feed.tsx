import { BookCardList } from '@/components/book-card-list';
import { EmptyState } from '@/components/empty-state';
import { ThemeToggle } from '@/components/theme-toggle';
import { useInfiniteScroll, useReadingRecords } from '@/hooks';
import { FILTER_LABELS, MESSAGES, PAGE_TITLES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { FeedScope, ReadingRecordFilters, ReadingRecordSort } from '@/types';
import { Rss } from 'lucide-react';
import { useMemo, useState } from 'react';

const SCOPE_OPTIONS: { value: FeedScope; label: string }[] = [
  { value: 'all', label: FILTER_LABELS.SCOPE_ALL },
  { value: 'friends', label: FILTER_LABELS.SCOPE_FRIENDS },
];

export function FeedPage() {
  const [scope, setScope] = useState<FeedScope>('all');
  const [filters] = useState<ReadingRecordFilters>({});
  const [sort] = useState<ReadingRecordSort>({
    field: 'updated_at',
    direction: 'desc',
  });

  const feedFilters = useMemo(() => ({ ...filters, scope }), [filters, scope]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useReadingRecords(
    feedFilters,
    sort
  );

  const records = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data]);

  const { observerTarget } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3 max-w-6xl">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">{PAGE_TITLES.FEED}</h1>
            <ThemeToggle />
          </div>

          <div className="flex gap-1 mt-3 p-1 bg-muted rounded-lg">
            {SCOPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setScope(opt.value)}
                className={cn(
                  'flex-1 py-1.5 text-sm font-medium rounded-md transition-colors',
                  scope === opt.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 max-w-6xl">
        <BookCardList
          records={records}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          observerTarget={observerTarget}
          showAuthor
          emptyState={
            <EmptyState icon={<Rss size={48} strokeWidth={1} />} message={MESSAGES.NO_FEED_BOOKS} />
          }
        />
      </main>
    </div>
  );
}
