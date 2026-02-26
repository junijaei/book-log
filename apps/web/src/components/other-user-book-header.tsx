/**
 * other-user-book-header.tsx
 *
 * Header panel for the book detail page — viewer's perspective (read-only).
 * Shows cover, title, author, pages, rating, status, and date range.
 * Visibility is intentionally omitted (private to the owner).
 * No edit controls, no spinners, no permission logic.
 */

import { BookCover } from '@/components/book-cover';
import { DateRangeDisplay } from '@/components/date-range-display';
import { StatusBadge } from '@/components/status-badge';
import { renderRatingStars } from '@/lib/constants';
import type { ReadingRecord } from '@/types';

interface OtherUserBookHeaderProps {
  record: ReadingRecord;
}

export function OtherUserBookHeader({ record }: OtherUserBookHeaderProps) {
  const { book, reading_log } = record;

  return (
    <div className="bg-muted/30 rounded-lg p-4 flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <BookCover url={book.cover_image_url} alt={book.title} size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-lg leading-tight line-clamp-2">{book.title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{book.author}</p>
              {book.total_pages != null && (
                <p className="text-sm text-muted-foreground mt-0.5">{book.total_pages}p</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <hr />

      <div className="flex flex-col items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {/* Rating — only shown when set */}
        {reading_log.rating != null && (
          <div className="flex w-full px-3 gap-2 items-center">
            <p className="basis-1/4">별점</p>
            <span className="text-amber-500">{renderRatingStars(reading_log.rating)}</span>
          </div>
        )}

        {/* Status */}
        <div className="flex w-full px-3 gap-2 items-center">
          <p className="basis-1/4">독서 상태</p>
          <StatusBadge status={reading_log.status} />
        </div>

        {/* Date range — only shown when at least one date is set */}
        {(reading_log.start_date || reading_log.end_date) && (
          <div className="flex w-full px-3 gap-2 items-center">
            <p className="basis-1/4">독서 기간</p>
            <DateRangeDisplay
              startDate={reading_log.start_date}
              endDate={reading_log.end_date}
              variant="inline"
            />
          </div>
        )}
      </div>
    </div>
  );
}
