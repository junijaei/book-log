/**
 * Book Detail Page
 *
 * Displays full reading record with inline editing (Notion-style),
 * reflections (reviews) section, quotes section, and delete functionality.
 * No separate edit page navigation — everything is done inline.
 */

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateQuote,
  useCreateReview,
  useDeleteQuote,
  useDeleteReadingRecord,
  useDeleteReview,
  useReadingRecord,
  useUpdateQuote,
  useUpdateReview,
  useUpsertReadingRecord,
} from '@/hooks';
import { messages } from '@/constants/messages';
import { getReadingStatusLabel, renderRatingStars } from '@/lib/constants';
import type {
  Quote,
  ReadingRecord,
  ReadingStatus,
  Review,
  UpsertPayload,
  Visibility,
} from '@/types';
import confetti from 'canvas-confetti';
import { Loader2, NotebookText, Quote as QuoteIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

const READING_STATUSES: ReadingStatus[] = ['want_to_read', 'reading', 'finished', 'abandoned'];

// ─── Upsert payload helper ───────────────────────────────────────────────────

function buildPayload(
  record: ReadingRecord,
  bookOverrides: Partial<{ title: string; author: string }> = {},
  logOverrides: Partial<{
    status: ReadingStatus;
    current_page: number | null;
    rating: number | null;
    start_date: string | null;
    end_date: string | null;
    review: string | null;
    visibility: Visibility;
  }> = {}
): UpsertPayload {
  return {
    book: {
      id: record.book.id,
      title: bookOverrides.title ?? record.book.title,
      author: bookOverrides.author ?? record.book.author,
      cover_image_url: record.book.cover_image_url,
      total_pages: record.book.total_pages,
    },
    reading_log: {
      id: record.reading_log.id,
      status: logOverrides.status ?? record.reading_log.status,
      current_page:
        logOverrides.current_page !== undefined
          ? logOverrides.current_page
          : record.reading_log.current_page,
      rating: logOverrides.rating !== undefined ? logOverrides.rating : record.reading_log.rating,
      start_date: logOverrides.start_date ?? record.reading_log.start_date,
      end_date: logOverrides.end_date ?? record.reading_log.end_date,
      review: logOverrides.review !== undefined ? logOverrides.review : record.reading_log.review,
      visibility: (logOverrides.visibility ??
        record.reading_log.visibility ??
        'public') as Visibility,
    },
  };
}

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: record, isLoading } = useReadingRecord(id);

  // ── Mutations ──
  const upsertMutation = useUpsertReadingRecord();
  const deleteMutation = useDeleteReadingRecord();
  const createQuoteMutation = useCreateQuote();
  const updateQuoteMutation = useUpdateQuote(id ?? '');
  const deleteQuoteMutation = useDeleteQuote(id ?? '');
  const createReviewMutation = useCreateReview(id ?? '');
  const updateReviewMutation = useUpdateReview(id ?? '');
  const deleteReviewMutation = useDeleteReview(id ?? '');

  // ── Inline editing state ──
  const [editingField, setEditingField] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editCurrentPage, setEditCurrentPage] = useState('');
  const [editRating, setEditRating] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Completion dialog ──
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  // ── Quote state ──
  const [showAddQuote, setShowAddQuote] = useState(false);
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuotePage, setNewQuotePage] = useState('');
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editQuoteText, setEditQuoteText] = useState('');
  const [editQuotePage, setEditQuotePage] = useState('');
  const [deleteQuoteDialogOpen, setDeleteQuoteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);

  // ── Review state ──
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReviewContent, setNewReviewContent] = useState('');
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editReviewContent, setEditReviewContent] = useState('');
  const [deleteReviewDialogOpen, setDeleteReviewDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);

  // ── Delete record dialog ──
  const [deleteRecordDialogOpen, setDeleteRecordDialogOpen] = useState(false);

  // ── Inline field helpers ──

  const startEdit = (field: string, initialValue: string) => {
    setEditingField(field);
    if (field === 'title') setEditTitle(initialValue);
    else if (field === 'author') setEditAuthor(initialValue);
    else if (field === 'current_page') setEditCurrentPage(initialValue);
    else if (field === 'rating') setEditRating(initialValue);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const cancelEdit = () => setEditingField(null);

  const handleSaveTitle = async () => {
    if (!record || !editTitle.trim()) {
      cancelEdit();
      return;
    }
    setSavingField('title');
    try {
      await upsertMutation.mutateAsync(buildPayload(record, { title: editTitle.trim() }));
      toast.success(messages.common.success.savedSuccessfully);
    } catch (error) {
      console.error('Failed to save title:', error);
      toast.error(messages.common.errors.failedToSave);
    } finally {
      setSavingField(null);
      cancelEdit();
    }
  };

  const handleSaveAuthor = async () => {
    if (!record || !editAuthor.trim()) {
      cancelEdit();
      return;
    }
    setSavingField('author');
    try {
      await upsertMutation.mutateAsync(buildPayload(record, { author: editAuthor.trim() }));
      toast.success(messages.common.success.savedSuccessfully);
    } catch (error) {
      console.error('Failed to save author:', error);
      toast.error(messages.common.errors.failedToSave);
    } finally {
      setSavingField(null);
      cancelEdit();
    }
  };

  const handleSaveStatus = async (newStatus: ReadingStatus) => {
    if (!record) return;
    const today = new Date().toISOString().split('T')[0];
    const endDate = newStatus === 'finished' ? today : record.reading_log.end_date;
    setSavingField('status');
    try {
      await upsertMutation.mutateAsync(
        buildPayload(record, {}, { status: newStatus, end_date: endDate })
      );
      toast.success(messages.common.success.savedSuccessfully);
    } catch (error) {
      console.error('Failed to save status:', error);
      toast.error(messages.common.errors.failedToSave);
    } finally {
      setSavingField(null);
    }
  };

  const handleSaveCurrentPage = async () => {
    if (!record) {
      cancelEdit();
      return;
    }
    const parsed = parseInt(editCurrentPage);
    if (isNaN(parsed)) {
      cancelEdit();
      return;
    }
    const totalPages = record.book.total_pages;
    const newPage = totalPages ? Math.min(parsed, totalPages) : parsed;
    const previousPage = record.reading_log.current_page ?? 0;
    const isAlreadyFinished = record.reading_log.status === 'finished';
    setSavingField('current_page');
    try {
      await upsertMutation.mutateAsync(buildPayload(record, {}, { current_page: newPage }));
      toast.success(messages.common.success.savedSuccessfully);
      cancelEdit();
      if (totalPages && newPage >= totalPages && previousPage < totalPages && !isAlreadyFinished) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        setShowCompletionDialog(true);
      }
    } catch (error) {
      console.error('Failed to save current page:', error);
      toast.error(messages.common.errors.failedToSave);
      cancelEdit();
    } finally {
      setSavingField(null);
    }
  };

  const handleMarkCompleted = async () => {
    if (!record) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      await upsertMutation.mutateAsync(
        buildPayload(record, {}, { status: 'finished', end_date: today })
      );
      toast.success(messages.books.success.bookMarkedCompleted);
    } catch (error) {
      console.error('Failed to mark completed:', error);
      toast.error(messages.common.errors.failedToSave);
    } finally {
      setShowCompletionDialog(false);
    }
  };

  const handleSaveRating = async () => {
    if (!record) {
      cancelEdit();
      return;
    }
    const parsed = parseInt(editRating);
    const newRating = isNaN(parsed) ? null : Math.min(5, Math.max(1, parsed));
    setSavingField('rating');
    try {
      await upsertMutation.mutateAsync(buildPayload(record, {}, { rating: newRating }));
      toast.success(messages.common.success.savedSuccessfully);
    } catch (error) {
      console.error('Failed to save rating:', error);
      toast.error(messages.common.errors.failedToSave);
    } finally {
      setSavingField(null);
      cancelEdit();
    }
  };

  // ── Quote handlers ──

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

  // ── Review (reflection) handlers ──

  const handleAddReview = async () => {
    if (!id || !newReviewContent.trim()) return;
    try {
      await createReviewMutation.mutateAsync({
        reading_log_id: id,
        content: newReviewContent.trim(),
        page_number: null,
        reviewed_at: new Date().toISOString().split('T')[0],
      });
      setNewReviewContent('');
      setShowAddReview(false);
      toast.success(messages.books.success.reflectionAdded);
    } catch (error) {
      console.error('Failed to add reflection:', error);
      toast.error(messages.common.errors.failedToCreate);
    }
  };

  const handleUpdateReview = async () => {
    if (!editingReview || !editReviewContent.trim()) return;
    try {
      await updateReviewMutation.mutateAsync({
        id: editingReview.id,
        content: editReviewContent.trim(),
      });
      setEditingReview(null);
    } catch (error) {
      console.error('Failed to update reflection:', error);
      toast.error(messages.common.errors.failedToSave);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    try {
      await deleteReviewMutation.mutateAsync(reviewToDelete.id);
      setDeleteReviewDialogOpen(false);
      setReviewToDelete(null);
    } catch (error) {
      console.error('Failed to delete reflection:', error);
      toast.error(messages.common.errors.failedToDelete);
    }
  };

  // ── Delete record ──

  const handleDeleteRecord = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync({ reading_log_id: id });
      navigate('/');
    } catch (error) {
      console.error('Failed to delete reading record:', error);
      toast.error(messages.common.errors.failedToDelete);
    } finally {
      setDeleteRecordDialogOpen(false);
    }
  };

  // ── Loading / not found states ──

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
              <ThemeToggle />
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

  const { book, reading_log, quotes, reviews } = record;
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
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl animate-in fade-in-0 duration-300 space-y-8">
        {/* ── Book header panel ── */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex gap-4">
            <BookCover url={book.cover_image_url} alt={book.title} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Title — inline editable */}
                  {editingField === 'title' ? (
                    <Input
                      ref={inputRef}
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={handleSaveTitle}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="font-semibold text-base h-auto py-0.5 px-1 -mx-1"
                      aria-label={messages.books.fields.title}
                    />
                  ) : (
                    <h1
                      className={
                        'font-semibold text-lg leading-tight line-clamp-2' +
                        (isOwner ? ' cursor-pointer hover:text-primary/80 transition-colors' : '')
                      }
                      onClick={() => isOwner && startEdit('title', book.title)}
                    >
                      {book.title}
                      {savingField === 'title' && (
                        <Loader2 className="inline w-3 h-3 ml-1 animate-spin text-muted-foreground" />
                      )}
                    </h1>
                  )}

                  {/* Author — inline editable */}
                  {editingField === 'author' ? (
                    <Input
                      ref={inputRef}
                      value={editAuthor}
                      onChange={e => setEditAuthor(e.target.value)}
                      onBlur={handleSaveAuthor}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveAuthor();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="text-sm mt-0.5 h-auto py-0.5 px-1 -mx-1"
                      aria-label={messages.books.fields.author}
                    />
                  ) : (
                    <p
                      className={
                        'text-sm text-muted-foreground mt-0.5' +
                        (isOwner ? ' cursor-pointer hover:text-foreground transition-colors' : '')
                      }
                      onClick={() => isOwner && startEdit('author', book.author)}
                    >
                      {book.author}
                      {savingField === 'author' && (
                        <Loader2 className="inline w-3 h-3 ml-1 animate-spin text-muted-foreground" />
                      )}
                    </p>
                  )}
                </div>

                {/* Status — inline editable via Select */}
                <div className="flex items-center gap-1">
                  {isOwner ? (
                    <Select
                      value={reading_log.status}
                      onValueChange={v => handleSaveStatus(v as ReadingStatus)}
                    >
                      <SelectTrigger className="w-auto h-auto py-0.5 px-2 text-xs border-0 bg-transparent p-0 [&>svg]:hidden focus:ring-0 focus:ring-offset-0 shadow-none">
                        <SelectValue>
                          <StatusBadge status={reading_log.status} />
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {READING_STATUSES.map(status => (
                          <SelectItem key={status} value={status}>
                            {getReadingStatusLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusBadge status={reading_log.status} />
                  )}
                  {savingField === 'status' && (
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground">
                {/* Current page — inline editable */}
                {book.total_pages && (
                  <span>
                    {editingField === 'current_page' ? (
                      <Input
                        ref={inputRef}
                        type="number"
                        value={editCurrentPage}
                        onChange={e => setEditCurrentPage(e.target.value)}
                        onBlur={handleSaveCurrentPage}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveCurrentPage();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="inline-block w-20 h-6 py-0 px-1 text-sm"
                        aria-label={messages.books.fields.currentPage}
                      />
                    ) : (
                      <span
                        className={
                          isOwner ? 'cursor-pointer hover:text-foreground transition-colors' : ''
                        }
                        onClick={() =>
                          isOwner &&
                          startEdit('current_page', reading_log.current_page?.toString() ?? '0')
                        }
                      >
                        {reading_log.current_page ?? 0}/{book.total_pages}p (
                        {Math.round(((reading_log.current_page ?? 0) / book.total_pages) * 100)}%)
                        {savingField === 'current_page' && (
                          <Loader2 className="inline w-3 h-3 ml-1 animate-spin text-muted-foreground" />
                        )}
                      </span>
                    )}
                  </span>
                )}

                {/* Rating — inline editable */}
                {editingField === 'rating' ? (
                  <Input
                    ref={inputRef}
                    type="number"
                    min="1"
                    max="5"
                    value={editRating}
                    onChange={e => setEditRating(e.target.value)}
                    onBlur={handleSaveRating}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveRating();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    className="inline-block w-16 h-6 py-0 px-1 text-sm"
                    aria-label={messages.books.fields.rating}
                  />
                ) : reading_log.rating ? (
                  <span
                    className={
                      'text-amber-500' +
                      (isOwner ? ' cursor-pointer hover:opacity-80 transition-opacity' : '')
                    }
                    onClick={() =>
                      isOwner && startEdit('rating', reading_log.rating?.toString() ?? '')
                    }
                  >
                    {renderRatingStars(reading_log.rating)}
                    {savingField === 'rating' && (
                      <Loader2 className="inline w-3 h-3 ml-1 animate-spin text-muted-foreground" />
                    )}
                  </span>
                ) : isOwner ? (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    onClick={() => startEdit('rating', '')}
                  >
                    {messages.books.fields.rating}
                  </button>
                ) : null}

                <DateRangeDisplay
                  startDate={reading_log.start_date}
                  endDate={reading_log.end_date}
                  variant="inline"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Reflections (reviews) section ── */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {messages.books.reflections.sectionTitle}
              <span className="text-muted-foreground font-normal ml-2">({reviews.length})</span>
            </h2>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => setShowAddReview(!showAddReview)}>
                {showAddReview
                  ? messages.common.buttons.cancel
                  : messages.books.buttons.addReflection}
              </Button>
            )}
          </div>

          {/* Add review form */}
          {showAddReview && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/20">
              <h4 className="font-medium text-sm mb-3">{messages.books.reflections.addNew}</h4>
              <Textarea
                placeholder={messages.books.fields.reflectionContent}
                value={newReviewContent}
                onChange={e => setNewReviewContent(e.target.value)}
                rows={3}
                className="text-sm leading-relaxed resize-none mb-3"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddReview}
                  disabled={!newReviewContent.trim() || createReviewMutation.isPending}
                >
                  {createReviewMutation.isPending
                    ? messages.common.states.loading
                    : messages.common.buttons.add}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddReview(false);
                    setNewReviewContent('');
                  }}
                >
                  {messages.common.buttons.cancel}
                </Button>
              </div>
            </div>
          )}

          {/* Review list — date + content row format */}
          {reviews.length > 0 ? (
            <div className="divide-y divide-border/30">
              {reviews.map(review => (
                <article key={review.id} className="group flex gap-4 py-3">
                  <time className="text-xs text-muted-foreground shrink-0 w-[5.5rem] pt-0.5 tabular-nums">
                    {review.reviewed_at ?? '—'}
                  </time>
                  <p className="text-sm leading-relaxed flex-1 whitespace-pre-wrap">
                    {review.content}
                  </p>
                  {isOwner && (
                    <div className="flex gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingReview(review);
                          setEditReviewContent(review.content);
                        }}
                      >
                        {messages.common.buttons.edit}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReviewToDelete(review);
                          setDeleteReviewDialogOpen(true);
                        }}
                        disabled={deleteReviewMutation.isPending}
                      >
                        {messages.common.buttons.delete}
                      </Button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            !showAddReview && (
              <EmptyState
                icon={<NotebookText size={40} strokeWidth={1} />}
                message={messages.books.reflections.empty}
              />
            )
          )}
        </section>

        {/* ── Quotes section ── */}
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

          {/* Quote list */}
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
                      p.{quote.page_number ?? '—'}
                      {quote.noted_at && <span className="mx-2">·</span>}
                      {quote.noted_at}
                    </span>
                    {isOwner && (
                      <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingQuote(quote);
                            setEditQuoteText(quote.text);
                            setEditQuotePage((quote.page_number ?? '').toString());
                          }}
                        >
                          {messages.common.buttons.edit}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setQuoteToDelete(quote);
                            setDeleteQuoteDialogOpen(true);
                          }}
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

        {/* ── Danger zone ── */}
        {isOwner && (
          <div className="pt-4 border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteRecordDialogOpen(true)}
              disabled={deleteMutation.isPending}
            >
              {messages.books.buttons.deleteRecord}
            </Button>
          </div>
        )}
      </main>

      {/* ── Completion dialog ── */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messages.books.confirmations.bookCompletedTitle}</DialogTitle>
            <DialogDescription>{messages.books.confirmations.bookCompleted}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompletionDialog(false)}
              disabled={upsertMutation.isPending}
            >
              {messages.common.buttons.cancel}
            </Button>
            <Button size="sm" onClick={handleMarkCompleted} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending
                ? messages.common.states.loading
                : messages.books.buttons.markAsCompleted}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit quote dialog ── */}
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

      {/* ── Delete quote dialog ── */}
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

      {/* ── Edit reflection dialog ── */}
      <Dialog open={!!editingReview} onOpenChange={open => !open && setEditingReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">{messages.books.reflections.edit}</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <Textarea
              value={editReviewContent}
              onChange={e => setEditReviewContent(e.target.value)}
              rows={4}
              className="text-sm leading-relaxed"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingReview(null)}
              disabled={updateReviewMutation.isPending}
            >
              {messages.common.buttons.cancel}
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateReview}
              disabled={!editReviewContent.trim() || updateReviewMutation.isPending}
            >
              {updateReviewMutation.isPending
                ? messages.common.buttons.saving
                : messages.common.buttons.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete reflection dialog ── */}
      <Dialog open={deleteReviewDialogOpen} onOpenChange={setDeleteReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">{messages.books.reflections.delete}</DialogTitle>
            <DialogDescription className="text-sm">
              {messages.books.confirmations.deleteReflection}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteReviewDialogOpen(false)}
              disabled={deleteReviewMutation.isPending}
            >
              {messages.common.buttons.cancel}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteReview}
              disabled={deleteReviewMutation.isPending}
            >
              {deleteReviewMutation.isPending
                ? messages.common.buttons.deleting
                : messages.common.buttons.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete reading record dialog ── */}
      <Dialog open={deleteRecordDialogOpen} onOpenChange={setDeleteRecordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">
              {messages.books.confirmations.deleteTitle}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {messages.books.confirmations.deleteMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteRecordDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              {messages.common.buttons.cancel}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteRecord}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? messages.common.buttons.deleting
                : messages.common.buttons.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
