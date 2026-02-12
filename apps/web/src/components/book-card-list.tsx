import type { ReadingRecord } from '@/types';
import type { ReactNode, RefObject } from 'react';
import { BookCard } from './book-card';
import { BookCardSkeleton, BookListSkeleton } from './skeletons';

interface BookCardListProps {
  records: ReadingRecord[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  emptyState: ReactNode;
  showAuthor?: boolean;
  observerTarget: RefObject<HTMLDivElement | null>;
}

export function BookCardList({
  records,
  isLoading,
  isFetchingNextPage,
  emptyState,
  showAuthor,
  observerTarget,
}: BookCardListProps) {
  if (isLoading) {
    return <BookListSkeleton />;
  }

  if (records.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in-0 duration-300">
        {records.map(record => (
          <BookCard key={record.reading_log.id} record={record} showAuthor={showAuthor} />
        ))}
      </div>

      {isFetchingNextPage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      )}

      <div ref={observerTarget} className="h-10" />
    </>
  );
}
