import { BookCover } from '@/components/book-cover';
import { DateRangeDisplay } from '@/components/date-range-display';
import { EmptyState } from '@/components/empty-state';
import { BookDetailSkeleton } from '@/components/skeletons';
import { StatusBadge } from '@/components/status-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateQuote, useDeleteQuote, useReadingRecord, useUpdateQuote } from '@/hooks';
import { messages } from '@/constants/messages';
import { renderRatingStars } from '@/lib/constants';
import type { Quote } from '@/types';
import { Quote as QuoteIcon } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: record, isLoading } = useReadingRecord(id);

  const createQuoteMutation = useCreateQuote();
  const updateQuoteMutation = useUpdateQuote(id ?? '');
  const deleteQuoteMutation = useDeleteQuote(id ?? '');

  const [showAddQuote, setShowAddQuote] = useState(false);
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuotePage, setNewQuotePage] = useState('');

  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editQuoteText, setEditQuoteText] = useState('');
  const [editQuotePage, setEditQuotePage] = useState('');

  const [deleteQuoteDialogOpen, setDeleteQuoteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);

  const handleAddQuote = async () => {
    if (!id || !newQuoteText.trim() || !newQuotePage) return;

    try {
      await createQuoteMutation.mutateAsync({
        reading_log_id: id,
        text: newQuoteText.trim(),
        page_number: parseInt(newQuotePage),
        noted_at: new Date().toISOString().split('T')[0],
      });

      setNewQuoteText('');
      setNewQuotePage('');
      setShowAddQuote(false);
      toast.success(messages.books.success.quoteAdded);
    } catch (error) {
      console.error('Failed to add quote:', error);
      toast.error(messages.common.errors.failedToCreate);
    }
  };

  const openEditDialog = (quote: Quote) => {
    setEditingQuote(quote);
    setEditQuoteText(quote.text);
    setEditQuotePage(quote.page_number.toString());
  };

  const handleUpdateQuote = async () => {
    if (!editingQuote || !editQuoteText.trim() || !editQuotePage) return;

    try {
      await updateQuoteMutation.mutateAsync({
        id: editingQuote.id,
        text: editQuoteText.trim(),
        page_number: parseInt(editQuotePage),
      });

      setEditingQuote(null);
    } catch (error) {
      console.error('Failed to update quote:', error);
      toast.error(messages.common.errors.failedToSave);
    }
  };

  const openDeleteDialog = (quote: Quote) => {
    setQuoteToDelete(quote);
    setDeleteQuoteDialogOpen(true);
  };

  const handleDeleteQuote = async () => {
    if (!quoteToDelete) return;

    try {
      await deleteQuoteMutation.mutateAsync(quoteToDelete.id);

      setDeleteQuoteDialogOpen(false);
      setQuoteToDelete(null);
    } catch (error) {
      console.error('Failed to delete quote:', error);
      toast.error(messages.common.errors.failedToDelete);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
          <div className="container mx-auto px-4 py-3 max-w-4xl">
            <div className="flex justify-between items-center">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  ← {messages.common.buttons.back}
                </Button>
              </Link>
              <div className="flex gap-2">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-4 max-w-4xl">
          <BookDetailSkeleton />
        </main>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen">
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground mb-4">{messages.books.messages.notFound}</p>
          <Link to="/">
            <Button variant="outline" size="sm">
              {messages.books.buttons.backToList}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { book, reading_log, quotes } = record;
  const isOwner = user?.id === reading_log.user_id;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <div className="flex justify-between items-center">
            <Link to="/">
              <Button variant="ghost" size="sm">
                ← {messages.common.buttons.back}
              </Button>
            </Link>
            <div className="flex gap-2">
              <ThemeToggle />
              {isOwner && (
                <Link to={`/books/${id}/edit`}>
                  <Button size="sm">{messages.common.buttons.edit}</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl animate-in fade-in-0 duration-300">
        <div className="bg-muted/30 rounded-lg p-4 mb-8">
          <div className="flex gap-4">
            <BookCover url={book.cover_image_url} alt={book.title} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="font-semibold text-lg leading-tight line-clamp-2">{book.title}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">{book.author}</p>
                </div>
                <StatusBadge status={reading_log.status} />
              </div>

              {/* Inline metadata row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
                {book.total_pages && reading_log.current_page && (
                  <span>
                    {reading_log.current_page}/{book.total_pages}p (
                    {Math.round((reading_log.current_page / book.total_pages) * 100)}%)
                  </span>
                )}
                {reading_log.rating && (
                  <span className="text-amber-500">{renderRatingStars(reading_log.rating)}</span>
                )}
                <DateRangeDisplay
                  startDate={reading_log.start_date}
                  endDate={reading_log.end_date}
                  variant="inline"
                />
              </div>
            </div>
          </div>

          {/* Review section - collapsed by default feel */}
          {reading_log.review && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {reading_log.review}
              </p>
            </div>
          )}
        </div>

        {/* QUOTES SECTION - Primary content */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">
              {messages.books.fields.quotes}
              <span className="text-muted-foreground font-normal ml-2">({quotes.length})</span>
            </h2>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => setShowAddQuote(!showAddQuote)}>
                {showAddQuote ? messages.common.buttons.cancel : messages.books.buttons.addQuote}
              </Button>
            )}
          </div>

          {/* Add quote form */}
          {showAddQuote && (
            <div className="mb-8 p-4 border rounded-lg bg-muted/20">
              <h4 className="font-medium text-sm mb-3">{messages.books.quotes.addNew}</h4>
              <div className="space-y-3">
                <Textarea
                  placeholder={messages.books.placeholders.quoteText}
                  value={newQuoteText}
                  onChange={e => setNewQuoteText(e.target.value)}
                  rows={4}
                  className="text-base leading-relaxed"
                />
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder={messages.books.placeholders.pageNumber}
                    value={newQuotePage}
                    onChange={e => setNewQuotePage(e.target.value)}
                    className="w-28"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddQuote}
                    disabled={
                      !newQuoteText.trim() || !newQuotePage || createQuoteMutation.isPending
                    }
                  >
                    {createQuoteMutation.isPending
                      ? messages.common.states.loading
                      : messages.common.buttons.add}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Quote list - optimized for reading */}
          {quotes.length > 0 ? (
            <div className="space-y-6">
              {quotes.map(quote => (
                <article
                  key={quote.id}
                  className="group border-l-2 border-primary/20 pl-6 py-4 pr-8 sm:pr-0 hover:border-primary/40 transition-colors"
                >
                  <blockquote className="quote-text whitespace-pre-wrap">
                    &ldquo;{quote.text}&rdquo;
                  </blockquote>
                  <div className="flex justify-between items-center mt-4">
                    <span className="quote-meta">
                      p.{quote.page_number}
                      {quote.noted_at && <span className="mx-2">·</span>}
                      {quote.noted_at}
                    </span>
                    {isOwner && (
                      <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(quote)}>
                          {messages.common.buttons.edit}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(quote)}
                          disabled={deleteQuoteMutation.isPending}
                        >
                          {messages.common.buttons.delete}
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            !showAddQuote && (
              <EmptyState
                icon={<QuoteIcon size={48} strokeWidth={1} />}
                message={messages.books.quotes.empty}
              />
            )
          )}
        </section>
      </main>

      <Dialog open={!!editingQuote} onOpenChange={open => !open && setEditingQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">{messages.books.quotes.edit}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <Field>
              <FieldLabel htmlFor="edit-quote-text">{messages.books.fields.quoteText}</FieldLabel>
              <Textarea
                id="edit-quote-text"
                value={editQuoteText}
                onChange={e => setEditQuoteText(e.target.value)}
                rows={4}
                className="text-sm"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-quote-page">{messages.books.fields.pageNumber}</FieldLabel>
              <Input
                id="edit-quote-page"
                type="number"
                value={editQuotePage}
                onChange={e => setEditQuotePage(e.target.value)}
                className="text-sm"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingQuote(null)}
              disabled={updateQuoteMutation.isPending}
            >
              {messages.common.buttons.cancel}
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateQuote}
              disabled={!editQuoteText.trim() || !editQuotePage || updateQuoteMutation.isPending}
            >
              {updateQuoteMutation.isPending
                ? messages.common.buttons.saving
                : messages.common.buttons.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteQuoteDialogOpen} onOpenChange={setDeleteQuoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">{messages.books.quotes.delete}</DialogTitle>
            <DialogDescription className="text-sm">
              {messages.books.confirmations.deleteQuote}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteQuoteDialogOpen(false)}
              disabled={deleteQuoteMutation.isPending}
            >
              {messages.common.buttons.cancel}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteQuote}
              disabled={deleteQuoteMutation.isPending}
            >
              {deleteQuoteMutation.isPending
                ? messages.common.buttons.deleting
                : messages.common.buttons.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
