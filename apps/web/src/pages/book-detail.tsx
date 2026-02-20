/**
 * Book Detail Page
 *
 * Displays full reading record with inline editing (Notion-style),
 * reflections (reviews) section, quotes section, and delete functionality.
 * No separate edit page navigation — everything is done inline.
 */

import { BookCover } from '@/components/book-cover';
import { DateRangeDisplay } from '@/components/date-range-display';
import { DateRangePicker } from '@/components/ui/date-range-picker';
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
  useIsMobile,
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
import { Drawer } from 'vaul';

const READING_STATUSES: ReadingStatus[] = ['want_to_read', 'reading', 'finished', 'abandoned'];

// ─── Upsert payload helper ───────────────────────────────────────────────────

function buildPayload(
  record: ReadingRecord,
  bookOverrides: Partial<{ title: string; author: string; total_pages: number | null }> = {},
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
      // Use !== undefined so an explicit null clears the value
      total_pages:
        bookOverrides.total_pages !== undefined
          ? bookOverrides.total_pages
          : record.book.total_pages,
    },
    reading_log: {
      id: record.reading_log.id,
      status: logOverrides.status ?? record.reading_log.status,
      current_page:
        logOverrides.current_page !== undefined
          ? logOverrides.current_page
          : record.reading_log.current_page,
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
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [editingField, setEditingField] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editCurrentPage, setEditCurrentPage] = useState('');
  const [editTotalPages, setEditTotalPages] = useState('');
  const [editRating, setEditRating] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Field picker drawer (mobile, non-keyboard fields) ──
  const [drawerField, setDrawerField] = useState<'status' | 'rating' | null>(null);

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
    else if (field === 'total_pages') setEditTotalPages(initialValue);
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
    // Skip API call if nothing changed
    if (editTitle.trim() === record.book.title) {
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
    // Skip API call if nothing changed
    if (editAuthor.trim() === record.book.author) {
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
    // Skip API call if nothing changed (compare clamped value against stored value)
    if (newPage === previousPage) {
      cancelEdit();
      return;
    }
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

  // Shared core — called by both the mobile drawer picker and the desktop keyboard input.
  const handleSaveRatingValue = async (newRating: number | null) => {
    if (!record) return;
    setSavingField('rating');
    try {
      await upsertMutation.mutateAsync(buildPayload(record, {}, { rating: newRating }));
      toast.success(messages.common.success.savedSuccessfully);
    } catch (error) {
      console.error('Failed to save rating:', error);
      toast.error(messages.common.errors.failedToSave);
    } finally {
      setSavingField(null);
    }
  };

  // Desktop keyboard variant — parses from editRating state then delegates.
  const handleSaveRating = async () => {
    if (!record) {
      cancelEdit();
      return;
    }
    const parsed = parseInt(editRating);
    const newRating = isNaN(parsed) ? null : Math.min(5, Math.max(1, parsed));
    // Skip API call if nothing changed (both null, or same integer)
    if (newRating === (record.reading_log.rating ?? null)) {
      cancelEdit();
      return;
    }
    await handleSaveRatingValue(newRating);
    cancelEdit();
  };

  const handleSaveTotalPages = async () => {
    if (!record) {
      cancelEdit();
      return;
    }
    const parsed = parseInt(editTotalPages);
    // Treat 0 or non-numeric as clearing total_pages
    const newTotal = isNaN(parsed) || parsed <= 0 ? null : parsed;
    // Skip API call if nothing changed
    if (newTotal === (record.book.total_pages ?? null)) {
      cancelEdit();
      return;
    }
    setSavingField('total_pages');
    try {
      await upsertMutation.mutateAsync(buildPayload(record, { total_pages: newTotal }));
      toast.success(messages.common.success.savedSuccessfully);
    } catch (error) {
      console.error('Failed to save total pages:', error);
      toast.error(messages.common.errors.failedToSave);
    } finally {
      setSavingField(null);
      cancelEdit();
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
        buildPayload(record, {}, { start_date: newStart, end_date: newEnd })
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

                {/* Status — drawer picker on mobile / Select dropdown on desktop */}
                <div className="flex items-center gap-1">
                  {isOwner ? (
                    isMobile ? (
                      // Mobile: no keyboard needed → Vaul bottom sheet
                      <button
                        type="button"
                        onClick={() => setDrawerField('status')}
                        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                        aria-label={messages.books.fields.status}
                      >
                        <StatusBadge status={reading_log.status} />
                      </button>
                    ) : (
                      // Desktop: inline Select is fine with a pointer
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
                    )
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
                {/* Current page / Total pages — each editable independently for owner */}
                {(book.total_pages != null || isOwner) && (
                  <span className="flex items-center gap-1">
                    {/* Current page — shown only when total pages is known */}
                    {book.total_pages != null && (
                      <>
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
                            className="inline-block w-16 h-6 py-0 px-1 text-sm"
                            aria-label={messages.books.fields.currentPage}
                          />
                        ) : (
                          <span
                            className={
                              isOwner
                                ? 'cursor-pointer hover:text-foreground transition-colors'
                                : ''
                            }
                            onClick={() =>
                              isOwner &&
                              startEdit('current_page', reading_log.current_page?.toString() ?? '0')
                            }
                          >
                            {reading_log.current_page ?? 0}
                            {savingField === 'current_page' && (
                              <Loader2 className="inline w-3 h-3 ml-1 animate-spin text-muted-foreground" />
                            )}
                          </span>
                        )}
                        <span className="text-muted-foreground/60">/</span>
                      </>
                    )}

                    {/* Total pages — always editable for owner even when not yet set */}
                    {editingField === 'total_pages' ? (
                      <Input
                        ref={inputRef}
                        type="number"
                        value={editTotalPages}
                        onChange={e => setEditTotalPages(e.target.value)}
                        onBlur={handleSaveTotalPages}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveTotalPages();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="inline-block w-20 h-6 py-0 px-1 text-sm"
                        aria-label={messages.books.fields.totalPages}
                      />
                    ) : (
                      <span
                        className={
                          isOwner
                            ? 'cursor-pointer hover:text-foreground transition-colors' +
                              (book.total_pages == null ? ' text-xs text-muted-foreground/50' : '')
                            : ''
                        }
                        onClick={() =>
                          isOwner && startEdit('total_pages', book.total_pages?.toString() ?? '')
                        }
                      >
                        {book.total_pages != null
                          ? `${book.total_pages}p`
                          : messages.books.fields.totalPages}
                        {savingField === 'total_pages' && (
                          <Loader2 className="inline w-3 h-3 ml-1 animate-spin text-muted-foreground" />
                        )}
                      </span>
                    )}

                    {/* Progress % — hidden while editing either field */}
                    {book.total_pages != null &&
                      book.total_pages > 0 &&
                      editingField !== 'current_page' &&
                      editingField !== 'total_pages' && (
                        <span>
                          ({Math.round(((reading_log.current_page ?? 0) / book.total_pages) * 100)}
                          %)
                        </span>
                      )}
                  </span>
                )}

                {/* Rating — drawer picker on mobile / inline number input on desktop */}
                {isMobile ? (
                  // Mobile: no keyboard needed → Vaul bottom sheet
                  isOwner ? (
                    <button
                      type="button"
                      onClick={() => setDrawerField('rating')}
                      className={
                        'flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded' +
                        (reading_log.rating
                          ? ' text-amber-500'
                          : ' text-xs text-muted-foreground/50')
                      }
                      aria-label={messages.books.fields.rating}
                    >
                      {reading_log.rating
                        ? renderRatingStars(reading_log.rating)
                        : messages.books.fields.rating}
                      {savingField === 'rating' && (
                        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      )}
                    </button>
                  ) : reading_log.rating ? (
                    <span className="text-amber-500">{renderRatingStars(reading_log.rating)}</span>
                  ) : null
                ) : // Desktop: keyboard input inline
                editingField === 'rating' ? (
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

                {/* Reading period — editable for owner, read-only for others */}
                {isOwner ? (
                  <span className="flex items-center gap-1">
                    <DateRangePicker
                      value={{
                        from: reading_log.start_date ?? undefined,
                        to: reading_log.end_date ?? undefined,
                      }}
                      onChange={({ from, to }) => handleSaveDateRange(from ?? null, to ?? null)}
                      disabled={savingField === 'date_range'}
                    />
                    {savingField === 'date_range' && (
                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                    )}
                  </span>
                ) : (
                  <DateRangeDisplay
                    startDate={reading_log.start_date}
                    endDate={reading_log.end_date}
                    variant="inline"
                  />
                )}
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

      {/* ── Field picker drawer (mobile only — non-keyboard fields: status, rating) ── */}
      <Drawer.Root open={drawerField !== null} onOpenChange={open => !open && setDrawerField(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background"
            aria-describedby={undefined}
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted" />
            <div className="p-4 pt-3">
              {drawerField === 'status' && (
                <>
                  <Drawer.Title className="text-base font-semibold mb-4">
                    {messages.books.fields.status}
                  </Drawer.Title>
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
                          setDrawerField(null);
                        }}
                      >
                        {getReadingStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {drawerField === 'rating' && (
                <>
                  <Drawer.Title className="text-base font-semibold mb-4">
                    {messages.books.fields.rating}
                  </Drawer.Title>
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
                          setDrawerField(null);
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
                          setDrawerField(null);
                        }}
                      >
                        {messages.books.buttons.clearRating}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

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
