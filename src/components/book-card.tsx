import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from './ui/card';
import { StatusBadge } from './status-badge';
import type { ReadingRecord } from '@/types';

interface BookCardProps {
  record: ReadingRecord;
}

export function BookCard({ record }: BookCardProps) {
  const { book, reading_log } = record;

  const progress =
    book.total_pages && reading_log.current_page
      ? Math.round((reading_log.current_page / book.total_pages) * 100)
      : null;

  const dateRange = [reading_log.start_date, reading_log.end_date]
    .filter(Boolean)
    .join(' ~ ') || null;

  return (
    <Link to={`/books/${reading_log.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-4">
          <div className="flex gap-4">
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="w-20 h-28 object-cover rounded"
              />
            ) : (
              <div className="w-20 h-28 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                No Cover
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{book.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{book.author}</p>
              <div className="mt-2">
                <StatusBadge status={reading_log.status} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {progress !== null && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>
                  {reading_log.current_page} / {book.total_pages} pages ({progress}%)
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {dateRange && (
            <p className="text-xs text-muted-foreground">
              {dateRange}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
