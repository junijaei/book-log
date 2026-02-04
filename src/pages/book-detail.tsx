import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { BookCover } from '@/components/book-cover';
import { ProgressBar } from '@/components/progress-bar';
import { RatingDisplay } from '@/components/rating-display';
import { DateRangeDisplay } from '@/components/date-range-display';
import { ThemeToggle } from '@/components/theme-toggle';
import { getReadingRecord } from '@/api/mock-api';
import type { ReadingRecord } from '@/types';
import { BUTTON_LABELS, FIELD_LABELS, MESSAGES } from '@/lib/constants';

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<ReadingRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadRecord = async () => {
      try {
        const data = await getReadingRecord(id);
        setRecord(data);
      } catch (error) {
        console.error('Failed to load record:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecord();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">{MESSAGES.LOADING}</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{MESSAGES.BOOK_NOT_FOUND}</p>
          <Link to="/">
            <Button variant="outline">{BUTTON_LABELS.BACK_TO_LIST}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { book, reading_log, quotes } = record;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Link to="/">
          <Button variant="outline" size="sm">
            ← {BUTTON_LABELS.BACK}
          </Button>
        </Link>
        <div className="flex gap-2">
          <ThemeToggle />
          <Link to={`/books/${id}/edit`}>
            <Button>{BUTTON_LABELS.EDIT}</Button>
          </Link>
        </div>
      </div>

      {/* Book Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex gap-6">
            <BookCover url={book.cover_image_url} alt={book.title} size="md" />
            <div className="flex-1">
              <CardTitle className="mb-2">{book.title}</CardTitle>
              <p className="text-lg text-muted-foreground mb-4">{book.author}</p>
              <StatusBadge status={reading_log.status} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          <ProgressBar
            currentPage={reading_log.current_page}
            totalPages={book.total_pages}
            showLabel={true}
          />

          {/* Rating */}
          {reading_log.rating && <RatingDisplay rating={reading_log.rating} />}

          {/* Dates */}
          <DateRangeDisplay startDate={reading_log.start_date} endDate={reading_log.end_date} />

          {/* Review */}
          {reading_log.review && (
            <div>
              <h3 className="font-medium text-sm mb-2">{FIELD_LABELS.REVIEW}</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{reading_log.review}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quotes */}
      {quotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {FIELD_LABELS.QUOTES} ({quotes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quotes.map(quote => (
                <div key={quote.id} className="border-l-4 border-primary/30 pl-4">
                  <p className="text-foreground mb-2">&ldquo;{quote.text}&rdquo;</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>
                      {FIELD_LABELS.PAGE_NUMBER} {quote.page_number}
                    </span>
                    {quote.noted_at && <span>{quote.noted_at}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
