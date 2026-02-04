import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { getReadingRecord } from '@/api/mock-api';
import type { ReadingRecord } from '@/types';

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Book not found</p>
          <Link to="/">
            <Button variant="outline">Back to List</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { book, reading_log, quotes } = record;

  const progress =
    book.total_pages && reading_log.current_page
      ? Math.round((reading_log.current_page / book.total_pages) * 100)
      : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Link to="/">
          <Button variant="outline" size="sm">
            ← Back
          </Button>
        </Link>
        <Link to={`/books/${id}/edit`}>
          <Button>Edit</Button>
        </Link>
      </div>

      {/* Book Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex gap-6">
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="w-32 h-44 object-cover rounded"
              />
            ) : (
              <div className="w-32 h-44 bg-muted rounded flex items-center justify-center text-muted-foreground">
                No Cover
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="mb-2">{book.title}</CardTitle>
              <p className="text-lg text-muted-foreground mb-4">{book.author}</p>
              <StatusBadge status={reading_log.status} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          {progress !== null && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">
                  {reading_log.current_page} / {book.total_pages} pages ({progress}%)
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Rating */}
          {reading_log.rating && (
            <div>
              <span className="font-medium text-sm">Rating: </span>
              <span className="text-muted-foreground">
                {'★'.repeat(reading_log.rating)}
                {'☆'.repeat(5 - reading_log.rating)}
              </span>
            </div>
          )}

          {/* Dates */}
          {(reading_log.start_date || reading_log.end_date) && (
            <div className="flex gap-6 text-sm">
              {reading_log.start_date && (
                <div>
                  <span className="font-medium">Started: </span>
                  <span className="text-muted-foreground">{reading_log.start_date}</span>
                </div>
              )}
              {reading_log.end_date && (
                <div>
                  <span className="font-medium">Finished: </span>
                  <span className="text-muted-foreground">{reading_log.end_date}</span>
                </div>
              )}
            </div>
          )}

          {/* Review */}
          {reading_log.review && (
            <div>
              <h3 className="font-medium text-sm mb-2">Review</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{reading_log.review}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quotes */}
      {quotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Quotes ({quotes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quotes.map(quote => (
                <div key={quote.id} className="border-l-4 border-primary/30 pl-4">
                  <p className="text-foreground mb-2">"{quote.text}"</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Page {quote.page_number}</span>
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
