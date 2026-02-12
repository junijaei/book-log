import { formatDateRange, renderRatingStars } from '@/lib/constants';
import type { ReadingRecord } from '@/types';
import { Link } from 'react-router-dom';
import { BookCover } from './book-cover';
import { StatusBadge } from './status-badge';
import { Card, CardFooter, CardHeader } from './ui/card';

interface BookCardProps {
  record: ReadingRecord;
  showAuthor?: boolean;
}

export function BookCard({ record, showAuthor }: BookCardProps) {
  const { book, reading_log, profile } = record;

  const progress =
    book.total_pages && reading_log.current_page
      ? Math.round((reading_log.current_page / book.total_pages) * 100)
      : null;

  const dateRange = formatDateRange(reading_log.start_date, reading_log.end_date);

  return (
    <Link to={`/books/${reading_log.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
        {/* HEADER ZONE: Book info + Status */}
        <CardHeader className="pb-2">
          <div className="flex gap-3">
            <BookCover url={book.cover_image_url} alt={book.title} size="sm" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base leading-tight line-clamp-2">{book.title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{book.author}</p>
              {showAuthor && profile && (
                <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                  by {profile.nickname}
                </p>
              )}
              <div className="mt-2">
                <StatusBadge status={reading_log.status} />
              </div>
              {progress !== null && (
                <div className="py-3">
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 text-right">{progress}%</p>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        {/* BODY ZONE: Progress indicator (contextual) */}
        {/* <CardContent className="flex-1 py-0 px-6"></CardContent> */}

        {/* FOOTER ZONE: Metadata (de-emphasized) */}
        <CardFooter className="pt-2 sm:pt-2 sm:pb-4 sm:px-6 pb-4 px-6 flex justify-between items-center border-t border-border/50 mt-auto">
          <span className="text-xs text-muted-foreground/70">{dateRange || '\u00A0'}</span>
          {reading_log.rating && (
            <span className="text-xs text-amber-500/70">
              {renderRatingStars(reading_log.rating)}
            </span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
