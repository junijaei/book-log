/**
 * Book Detail Page
 *
 * Displays full reading record with inline editing (Notion-style),
 * reflections (reviews) section, quotes section, and delete functionality.
 * No separate edit page navigation — everything is done inline.
 */

import { BookCover } from '@/components/book-cover';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DateRangeDisplay } from '@/components/date-range-display';
import { DateRangeDrawerCalendar, EditableField } from '@/components/editable-field';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { BookDetailSkeleton } from '@/components/skeletons';
import { StatusBadge } from '@/components/status-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Dialog,
  DialogContent,
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
import { messages } from '@/constants/messages';
import {
  useCreateQuote,
  useCreateReview,
  useDeleteQuote,
  useDeleteReadingRecord,
  useDeleteReview,
  useIsMobile,
  useReadingRecord,
  useUpdateQuote,
  useUpdateReview,
  useUpsertReadingRecord,
} from '@/hooks';
import { useAuth } from '@/hooks/use-auth';
import { getReadingStatusLabel, renderRatingStars } from '@/lib/constants';
import type {
  Quote,
  ReadingRecord,
  ReadingStatus,
  Review,
  UpsertPayload,
  Visibility,
} from '@/types';
import { getRouteApi, useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowLeft, NotebookText, Pencil, Quote as QuoteIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const Route = getRouteApi('/_authenticated/books/$id');

const READING_STATUSES: ReadingStatus[] = ['want_to_read', 'reading', 'finished', 'abandoned'];

// ─── Upsert payload helper ───────────────────────────────────────────────────

function buildPayload(
  record: ReadingRecord,
  logOverrides: Partial<{
    status: ReadingStatus;
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
      title: record.book.title,
      author: record.book.author,
      cover_image_url: record.book.cover_image_url,
      total_pages: record.book.total_pages,
    },
    reading_log: {
      id: record.reading_log.id,
      status: logOverrides.status ?? record.reading_log.status,
      current_page: record.reading_log.current_page,
      rating: logOverrides.rating !== undefined ? logOverrides.rating : record.reading_log.rating,
      // Use !== undefined so explicit null clears the date
      start_date:
        logOverrides.start_date !== undefined
          ? logOverrides.start_date
          : record.reading_log.start_date,
      end_date:
        logOverrides.end_date !== undefined ? logOverrides.end_date : record.reading_log.end_date,
      review: logOverrides.review !== undefined ? logOverrides.review : record.reading_log.review,
      visibility: (logOverrides.visibility ??
        record.reading_log.visibility ??
        'public') as Visibility,
    },
  };
}

export function BookDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const { data: record, isLoading } = useReadingRecord(id);
  const isMobile = useIsMobile();

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
  const [savingField, setSavingField] = useState<string | null>(null);

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

  const handleSaveStatus = async (newStatus: ReadingStatus) => {
    if (!record) return;
    const today = new Date().toISOString().split('T')[0];
    const endDate = newStatus === 'finished' ? today : record.reading_log.end_date;
    setSavingField('status');
    try {
      await upsertMutation.mutateAsync(
        buildPayload(record, { status: newStatus, end_date: endDate })
      );
      toast.success(messages.common.success.savedSuccessfully);
    } catch (error) {
      console.error('Failed to save status:', error);
      toast.error(messages.common.errors.failedToSave);
    } finally {
      setSavingField(null);
    }
  };
  // Shared core — called by both the mobile drawer picker and the desktop keyboard input.
  const handleSaveRatingValue = async (newRating: number | null) => {
    if (!record) return;
    setSavingField('rating');
    try {
      await upsertMutation.mutateAsync(buildPayload(record, { rating: newRating }));
      toast.success(messages.common.success.savedSuccessfully);
    } catch (error) {
      console.error('Failed to save rating:', error);
      toast.error(messages.common.errors.failedToSave);
    } finally {
      setSavingField(null);
    }
  };

  const handleSaveDateRange = async (newStart: string | null, newEnd: string | null) => {
    if (!record) return;
    // Skip if neither value changed
    if (newStart === record.reading_log.start_date && newEnd === record.reading_log.end_date)
      return;
    setSavingField('date_range');
    try {
      await upsertMutation.mutateAsync(
        buildPayload(record, { start_date: newStart, end_date: newEnd })
      );
      toast.success(messages.common.success.savedSuccessfully);
    } catch (error) {
      console.error('Failed to save date range:', error);
      toast.error(messages.common.errors.failedToSave);
    } finally {
      setSavingField(null);
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
      void navigate({ to: '/' });
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
        <PageHeader
          maxWidth="max-w-4xl"
          left={
            <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
              <ArrowLeft className="h-4 w-4" />
              {messages.common.buttons.back}
            </Button>
          }
          right={<ThemeToggle />}
        />
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
          <Button variant="outline" size="sm" onClick={() => router.history.back()}>
            {messages.books.buttons.backToList}
          </Button>
        </div>
      </div>
    );
  }

  const { book, reading_log, quotes, reviews } = record;
  const isOwner = user?.id === reading_log.user_id;

  return (
    <div className="min-h-screen">
      <PageHeader
        maxWidth="max-w-4xl"
        left={
          <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            {messages.common.buttons.back}
          </Button>
        }
        right={<ThemeToggle />}
      />

      <main className="container mx-auto px-4 py-6 max-w-4xl animate-in fade-in-0 duration-300 space-y-8">
        {/* ── Book header panel ── */}
        <div className="bg-muted/30 rounded-lg p-4 flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <BookCover url={book.cover_image_url} alt={book.title} size="sm" />
              {/* Rating */}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Title */}
                  <h1 className="font-semibold text-lg leading-tight line-clamp-2">{book.title}</h1>

                  {/* Author */}
                  <p className="text-sm text-muted-foreground mt-0.5">{book.author}</p>
                  {/* Total pages */}
                  {book.total_pages != null && (
                    <p className="text-sm text-muted-foreground mt-0.5">{book.total_pages}p</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <hr />
          {/* Metadata row */}
          <div className="flex flex-col items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex w-full px-3 gap-2 items-center">
              <p className="basis-1/4">별점</p>
              <EditableField
                isOwner={isOwner}
                isMobile={isMobile}
                isSaving={savingField === 'rating'}
                label={messages.books.fields.rating}
                readView={
                  reading_log.rating ? (
                    <span className="text-amber-500">{renderRatingStars(reading_log.rating)}</span>
                  ) : (
                    <span className="text-muted-foreground/70 text-sm shrink-0 mb-0.5">☆☆☆☆☆</span>
                  )
                }
                mobileTrigger={
                  reading_log.rating ? (
                    <span className="text-amber-500">{renderRatingStars(reading_log.rating)}</span>
                  ) : (
                    <span className="text-muted-foreground/70 text-sm shrink-0 mb-0.5">☆☆☆☆☆</span>
                  )
                }
                desktopEdit={
                  <Select
                    value={reading_log.rating?.toString() ?? ''}
                    onValueChange={v => handleSaveRatingValue(v === 'clear' ? null : parseInt(v))}
                  >
                    <SelectTrigger className="w-auto h-auto border-0 bg-transparent shadow-none p-0 [&>svg]:hidden focus:ring-0 focus:ring-offset-0">
                      <SelectValue>
                        {reading_log.rating ? (
                          <span className="text-amber-500">
                            {renderRatingStars(reading_log.rating)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/70 text-sm shrink-0 mb-0.5">
                            ☆☆☆☆☆
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {([5, 4, 3, 2, 1] as const).map(star => (
                        <SelectItem key={star} value={star.toString()}>
                          <span className="text-amber-500">{renderRatingStars(star)}</span>
                          <span className="text-sm text-muted-foreground ml-2">{star}점</span>
                        </SelectItem>
                      ))}
                      {reading_log.rating && (
                        <SelectItem value="clear">{messages.books.buttons.clearRating}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                }
                drawerContent={onClose => (
                  <div className="space-y-1">
                    {([5, 4, 3, 2, 1] as const).map(star => (
                      <button
                        key={star}
                        type="button"
                        className={
                          'w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3' +
                          (reading_log.rating === star ? ' bg-primary/10' : ' hover:bg-muted')
                        }
                        onClick={() => {
                          handleSaveRatingValue(star);
                          onClose();
                        }}
                      >
                        <span className="text-amber-500">{renderRatingStars(star)}</span>
                        <span className="text-sm text-muted-foreground">{star}점</span>
                      </button>
                    ))}
                    {reading_log.rating && (
                      <button
                        type="button"
                        className="w-full text-left px-4 py-3 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
                        onClick={() => {
                          handleSaveRatingValue(null);
                          onClose();
                        }}
                      >
                        {messages.books.buttons.clearRating}
                      </button>
                    )}
                  </div>
                )}
              ></EditableField>
              <Pencil className="size-3" />
            </div>
            <div className="flex w-full px-3 gap-2 items-center">
              <p className="basis-1/4">독서 상태</p>
              <EditableField
                isOwner={isOwner}
                isMobile={isMobile}
                isSaving={savingField === 'status'}
                label={messages.books.fields.status}
                readView={<StatusBadge status={reading_log.status} />}
                desktopEdit={
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
                }
                drawerContent={onClose => (
                  <div className="space-y-1">
                    {READING_STATUSES.map(status => (
                      <button
                        key={status}
                        type="button"
                        className={
                          'w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors' +
                          (reading_log.status === status
                            ? ' bg-primary/10 text-primary'
                            : ' hover:bg-muted')
                        }
                        onClick={() => {
                          handleSaveStatus(status);
                          onClose();
                        }}
                      >
                        {getReadingStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                )}
              ></EditableField>
              <Pencil className="size-3" />
            </div>

            <div className="flex w-full px-3 gap-2 items-center">
              <p className="basis-1/4">공개 범위</p>
              <Badge>전체 공개</Badge>
              <Pencil className="size-3" />
            </div>
            <div className="flex w-full px-3 gap-2 items-center">
              <p className="basis-1/4">독서 기간</p>
              {/* Reading period */}
              <EditableField
                isOwner={isOwner}
                isMobile={isMobile}
                isSaving={savingField === 'date_range'}
                label={messages.books.fields.readingPeriod}
                readView={
                  <DateRangeDisplay
                    startDate={reading_log.start_date}
                    endDate={reading_log.end_date}
                    variant="inline"
                  />
                }
                mobileTrigger={
                  reading_log.start_date || reading_log.end_date ? (
                    <DateRangeDisplay
                      startDate={reading_log.start_date}
                      endDate={reading_log.end_date}
                      variant="inline"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground/50">
                      {messages.books.fields.readingPeriod}
                    </span>
                  )
                }
                desktopEdit={
                  <DateRangePicker
                    value={{
                      from: reading_log.start_date ?? undefined,
                      to: reading_log.end_date ?? undefined,
                    }}
                    onChange={({ from, to }) => handleSaveDateRange(from ?? null, to ?? null)}
                    disabled={savingField === 'date_range'}
                  />
                }
                drawerContent={onClose => (
                  <DateRangeDrawerCalendar
                    value={{
                      from: reading_log.start_date ?? undefined,
                      to: reading_log.end_date ?? undefined,
                    }}
                    onChange={({ from, to }) => handleSaveDateRange(from ?? null, to ?? null)}
                    onClose={onClose}
                  />
                )}
              ></EditableField>
              <Pencil className="size-3" />
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

          {/* Review list — content then date + actions row below */}
          {reviews.length > 0 ? (
            <div className="divide-y divide-border/30">
              {reviews.map(review => (
                <article key={review.id} className="group py-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap mb-2">
                    {review.content}
                  </p>
                  <div className="flex justify-between items-center">
                    <time className="text-xs text-muted-foreground tabular-nums">
                      {review.reviewed_at ?? '—'}
                    </time>
                    {isOwner && (
                      <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
                  </div>
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

      {/* ── Delete quote alert ── */}
      <ConfirmDialog
        open={deleteQuoteDialogOpen}
        onOpenChange={setDeleteQuoteDialogOpen}
        title={messages.books.quotes.delete}
        description={messages.books.confirmations.deleteQuote}
        confirmLabel={messages.common.buttons.delete}
        variant="destructive"
        isPending={deleteQuoteMutation.isPending}
        onConfirm={handleDeleteQuote}
        onCancel={() => setQuoteToDelete(null)}
      />

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

      {/* ── Delete reflection alert ── */}
      <ConfirmDialog
        open={deleteReviewDialogOpen}
        onOpenChange={setDeleteReviewDialogOpen}
        title={messages.books.reflections.delete}
        description={messages.books.confirmations.deleteReflection}
        confirmLabel={messages.common.buttons.delete}
        variant="destructive"
        isPending={deleteReviewMutation.isPending}
        onConfirm={handleDeleteReview}
        onCancel={() => setReviewToDelete(null)}
      />

      {/* ── Delete reading record alert ── */}
      <ConfirmDialog
        open={deleteRecordDialogOpen}
        onOpenChange={setDeleteRecordDialogOpen}
        title={messages.books.confirmations.deleteTitle}
        description={messages.books.confirmations.deleteMessage}
        confirmLabel={messages.common.buttons.delete}
        variant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={handleDeleteRecord}
      />
    </div>
  );
}
