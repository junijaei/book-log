/**
 * Reading Log Flow
 *
 * State-driven, multi-step reading log creation.
 * Renders as a React Fragment — the outer container (mobile overlay or desktop
 * Dialog) is provided by the caller.
 *
 * Steps
 *   'initial' — session date · current page · add review/quote buttons · save
 *   'review'  — multi-entry review list (page · date · content)
 *   'quote'   — multi-entry quote list  (page · date · text)
 *   'done'    — completion view with list / detail navigation
 */

import { messages } from '@/constants/messages';
import { useUpsertReadingRecord } from '@/hooks';
import type {
  ReadingRecord,
  UpsertPayload,
  UpsertQuoteData,
  UpsertReviewData,
  Visibility,
} from '@/types';
import confetti from 'canvas-confetti';
import { CheckCircle2, ChevronRight, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { DatePicker } from './ui/date-picker';
import { Field, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

// ── Entry shapes ──────────────────────────────────────────────────────────────

interface ReviewEntry {
  key: string;
  content: string;
  /** Page in the book (independent of current reading page) */
  page: string;
  date: string;
}

interface QuoteEntry {
  key: string;
  text: string;
  /** Page in the book (independent of current reading page) */
  page: string;
  date: string;
}

type Step = 'initial' | 'review' | 'quote' | 'done';
type SlideDir = 'right' | 'left';

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function buildUpsertPayload(
  record: ReadingRecord,
  currentPage: number,
  reviewEntries: ReviewEntry[],
  quoteEntries: QuoteEntry[],
  fallbackDate: string
): UpsertPayload {
  const reviews: UpsertReviewData[] = reviewEntries
    .filter(r => r.content.trim().length > 0)
    .map(r => {
      const parsedPage = parseInt(r.page);
      return {
        reading_log_id: record.reading_log.id,
        content: r.content.trim(),
        page_number: !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : null,
        reviewed_at: r.date || fallbackDate,
      };
    });

  const quotes: UpsertQuoteData[] = quoteEntries
    .filter(q => q.text.trim().length > 0)
    .map(q => {
      const parsedPage = parseInt(q.page);
      return {
        reading_log_id: record.reading_log.id,
        text: q.text.trim(),
        page_number: !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : currentPage,
        noted_at: q.date || fallbackDate,
      };
    });

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
      status: record.reading_log.status,
      current_page: currentPage,
      rating: record.reading_log.rating,
      start_date: record.reading_log.start_date,
      end_date: record.reading_log.end_date,
      review: record.reading_log.review,
      visibility: (record.reading_log.visibility as Visibility) ?? 'public',
    },
    reviews: reviews.length > 0 ? reviews : undefined,
    quotes: quotes.length > 0 ? quotes : undefined,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface ReadingLogFlowProps {
  record: ReadingRecord;
  /** Called when user wants to close: X button, done→list, done→detail+navigate */
  onClose: () => void;
  /** Reports dirty state upward so the wrapper can show the guard dialog */
  onDirtyChange: (dirty: boolean) => void;
}

export function ReadingLogFlow({ record, onClose, onDirtyChange }: ReadingLogFlowProps) {
  const { book, reading_log } = record;
  const navigate = useNavigate();

  // Monotonic key source — never triggers re-renders
  const keyRef = useRef(0);
  const newKey = () => String(++keyRef.current);

  // Ref for auto-focusing the first textarea on sub-page entry
  const firstTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Step state ──
  const [step, setStep] = useState<Step>('initial');
  const [slideDir, setSlideDir] = useState<SlideDir>('right');

  // ── Step 1 fields ──
  const [sessionDate, setSessionDate] = useState(todayStr);
  const [currentPage, setCurrentPage] = useState(reading_log.current_page?.toString() ?? '');

  // ── Review entries (multiple) ──
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);

  // ── Quote entries (multiple) ──
  const [quotes, setQuotes] = useState<QuoteEntry[]>([]);

  // ── Saved flag — set to true after successful save; suppresses guard ──
  const [saved, setSaved] = useState(false);

  // ── Mutation state ──
  const upsertMutation = useUpsertReadingRecord();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Confetti / completion tracking ──
  const previousPage = reading_log.current_page ?? 0;
  const isAlreadyFinished = reading_log.status === 'finished';

  // Auto-focus first textarea when entering a sub-page
  useEffect(() => {
    if (step === 'review' || step === 'quote') {
      const id = setTimeout(() => firstTextareaRef.current?.focus(), 150);
      return () => clearTimeout(id);
    }
  }, [step]);

  // ── Dirty detection ──
  const isDirty =
    !saved &&
    ((currentPage !== '' && currentPage !== (reading_log.current_page?.toString() ?? '')) ||
      reviews.some(r => r.content.trim().length > 0) ||
      quotes.some(q => q.text.trim().length > 0));

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  // ── Derived indicators ──
  const reviewsDone = reviews.some(r => r.content.trim().length > 0);
  const quotesDone = quotes.some(q => q.text.trim().length > 0);
  const reviewCount = reviews.filter(r => r.content.trim().length > 0).length;
  const quoteCount = quotes.filter(q => q.text.trim().length > 0).length;

  // ── Navigation helpers ──
  const goTo = (next: Step, dir: SlideDir) => {
    setSlideDir(dir);
    setStep(next);
  };

  const goToReview = () => {
    if (reviews.length === 0) {
      setReviews([{ key: newKey(), content: '', page: currentPage, date: sessionDate }]);
    }
    goTo('review', 'right');
  };

  const goToQuote = () => {
    if (quotes.length === 0) {
      setQuotes([{ key: newKey(), text: '', page: currentPage, date: sessionDate }]);
    }
    goTo('quote', 'right');
  };

  // "Next" on sub-page — prunes empty entries, returns to initial
  const handleReviewNext = () => {
    setReviews(prev => prev.filter(r => r.content.trim().length > 0));
    goTo('initial', 'left');
  };

  const handleQuoteNext = () => {
    setQuotes(prev => prev.filter(q => q.text.trim().length > 0));
    goTo('initial', 'left');
  };

  // Back button — returns without pruning (preserves draft state)
  const handleBack = () => goTo('initial', 'left');

  // ── Page-clamp ──
  const handlePageBlur = () => {
    if (!currentPage) return;
    const parsed = parseInt(currentPage);
    if (book.total_pages && parsed > book.total_pages) {
      setCurrentPage(book.total_pages.toString());
    }
  };

  // ── Entry management — reviews ──
  const addReview = () =>
    setReviews(prev => [
      ...prev,
      { key: newKey(), content: '', page: currentPage, date: sessionDate },
    ]);

  const updateReview = (key: string, patch: Partial<ReviewEntry>) =>
    setReviews(prev => prev.map(r => (r.key === key ? { ...r, ...patch } : r)));

  const removeReview = (key: string) => setReviews(prev => prev.filter(r => r.key !== key));

  // ── Entry management — quotes ──
  const addQuote = () =>
    setQuotes(prev => [...prev, { key: newKey(), text: '', page: currentPage, date: sessionDate }]);

  const updateQuote = (key: string, patch: Partial<QuoteEntry>) =>
    setQuotes(prev => prev.map(q => (q.key === key ? { ...q, ...patch } : q)));

  const removeQuote = (key: string) => setQuotes(prev => prev.filter(q => q.key !== key));

  // ── Mark as completed (confetti action) ──
  const handleMarkCompleted = async () => {
    const today = todayStr();
    try {
      await upsertMutation.mutateAsync({
        book: {
          id: record.book.id,
          title: record.book.title,
          author: record.book.author,
          cover_image_url: record.book.cover_image_url,
          total_pages: record.book.total_pages,
        },
        reading_log: {
          id: record.reading_log.id,
          status: 'finished',
          current_page: record.reading_log.current_page,
          rating: record.reading_log.rating,
          start_date: record.reading_log.start_date,
          end_date: today,
          review: record.reading_log.review,
          visibility: (record.reading_log.visibility as Visibility) ?? 'public',
        },
      });
      toast.success(messages.books.success.bookMarkedCompleted);
    } catch (error) {
      console.error('Failed to mark as completed:', error);
      toast.error(messages.common.errors.failedToSave);
    }
  };

  // ── Save ──
  const handleSave = async () => {
    if (!currentPage) return;
    const newPage = Math.min(parseInt(currentPage), book.total_pages ?? Number.MAX_SAFE_INTEGER);
    const fallbackDate = sessionDate || todayStr();

    setIsSubmitting(true);
    try {
      await upsertMutation.mutateAsync(
        buildUpsertPayload(record, newPage, reviews, quotes, fallbackDate)
      );

      setSaved(true);
      goTo('done', 'right');

      // Fire confetti if just reached the last page for the first time
      const shouldCelebrate =
        book.total_pages != null &&
        newPage >= book.total_pages &&
        previousPage < book.total_pages &&
        !isAlreadyFinished;

      if (shouldCelebrate) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        toast.success(messages.books.confirmations.bookCompletedTitle, {
          description: messages.books.confirmations.bookCompleted,
          duration: 10000,
          action: {
            label: messages.books.buttons.markAsCompleted,
            onClick: handleMarkCompleted,
          },
        });
      }
    } catch (error) {
      console.error('Failed to save reading record:', error);
      toast.error(messages.common.errors.failedToSave);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Slide animation: pushing right = new page, popping left = going back
  const slideClass =
    slideDir === 'right'
      ? 'animate-in slide-in-from-right-4 fade-in-0 duration-200'
      : 'animate-in slide-in-from-left-4 fade-in-0 duration-200';

  // ── Step title ──
  const stepTitle =
    step === 'review'
      ? messages.books.logFlow.reviewFormTitle
      : step === 'quote'
        ? messages.books.logFlow.quoteFormTitle
        : step === 'done'
          ? messages.books.logFlow.completedTitle
          : messages.books.logFlow.title;

  return (
    <>
      {/* ── Header — always visible ─────────────────────────────────────── */}
      <header className="shrink-0 flex items-center h-14 px-4 border-b bg-background/90 backdrop-blur-md">
        {step === 'review' || step === 'quote' ? (
          // Sub-page: left = back (no pruning)
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-11 pr-3 mr-1"
            aria-label={messages.common.buttons.back}
          >
            ← {messages.common.buttons.back}
          </button>
        ) : step !== 'done' ? (
          // Initial: right = close (triggers guard if dirty)
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 -ml-1 mr-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={messages.common.buttons.close}
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
        <h2 className="font-semibold text-base leading-none">{stepTitle}</h2>
      </header>

      {/* ── Scrollable content — keyed so animation fires on every step change ── */}
      <div
        key={step}
        className={`flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y ${slideClass}`}
      >
        {/* ── Step 1: Initial ──────────────────────────────────────────── */}
        {step === 'initial' && (
          <div className="px-4 pt-5 pb-32 space-y-6">
            {/* Book info */}
            <div>
              <p className="font-medium text-sm leading-tight">{book.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>
            </div>

            {/* Session date */}
            <Field>
              <FieldLabel htmlFor="log-session-date">{messages.books.logFlow.date}</FieldLabel>
              <DatePicker
                id="log-session-date"
                value={sessionDate}
                onChange={v => setSessionDate(v)}
              />
            </Field>

            {/* Current page + total */}
            <Field>
              <FieldLabel htmlFor="log-current-page">
                {messages.books.fields.currentPage}
              </FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="log-current-page"
                  type="number"
                  min="0"
                  max={book.total_pages ?? undefined}
                  value={currentPage}
                  onChange={e => setCurrentPage(e.target.value)}
                  onBlur={handlePageBlur}
                  placeholder={reading_log.current_page?.toString() ?? '0'}
                  className="w-28"
                />
                {book.total_pages && (
                  <span className="text-sm text-muted-foreground">
                    / {book.total_pages.toLocaleString()} {messages.books.details.pagesUnit}
                  </span>
                )}
              </div>
            </Field>

            {/* Add review / quote buttons */}
            <div className="space-y-2.5">
              {/* Review button */}
              <button
                type="button"
                onClick={goToReview}
                className="w-full flex items-center justify-between px-4 py-4 rounded-xl border bg-card hover:bg-accent/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {reviewsDone ? (
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  )}
                  <span className="text-sm font-medium">
                    {messages.books.buttons.addReflection}
                  </span>
                  {reviewCount > 0 && (
                    <span className="text-xs text-primary font-medium">{reviewCount}개</span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              </button>

              {/* Quote button */}
              <button
                type="button"
                onClick={goToQuote}
                className="w-full flex items-center justify-between px-4 py-4 rounded-xl border bg-card hover:bg-accent/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {quotesDone ? (
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  )}
                  <span className="text-sm font-medium">{messages.books.buttons.addQuote}</span>
                  {quoteCount > 0 && (
                    <span className="text-xs text-primary font-medium">{quoteCount}개</span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2a: Review list ────────────────────────────────────────── */}
        {step === 'review' && (
          <div className="px-4 pt-5 pb-32 space-y-4">
            {reviews.map((entry, index) => (
              <div key={entry.key}>
                {/* Entry header — index label + remove (only when > 1 entry) */}
                {reviews.length > 1 && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      감상 {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeReview(entry.key)}
                      className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      aria-label="삭제"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Page + date row */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field>
                    <FieldLabel htmlFor={`review-page-${entry.key}`}>
                      {messages.books.fields.pageNumber}
                    </FieldLabel>
                    <Input
                      id={`review-page-${entry.key}`}
                      type="number"
                      value={entry.page}
                      onChange={e => updateReview(entry.key, { page: e.target.value })}
                      placeholder="—"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`review-date-${entry.key}`}>
                      {messages.books.logFlow.date}
                    </FieldLabel>
                    <DatePicker
                      id={`review-date-${entry.key}`}
                      value={entry.date}
                      onChange={v => updateReview(entry.key, { date: v })}
                    />
                  </Field>
                </div>

                {/* Content textarea */}
                <Textarea
                  ref={index === 0 ? firstTextareaRef : undefined}
                  value={entry.content}
                  onChange={e => updateReview(entry.key, { content: e.target.value })}
                  placeholder={messages.books.fields.reflectionContent}
                  rows={6}
                  className="resize-none text-sm leading-relaxed w-full"
                />

                {/* Separator between entries */}
                {index < reviews.length - 1 && <div className="border-b border-border/40 mt-4" />}
              </div>
            ))}

            {/* Add another entry */}
            <button
              type="button"
              onClick={addReview}
              className="w-full flex items-center justify-center gap-1.5 py-3.5 rounded-xl border border-dashed text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
              {messages.books.logFlow.addEntry}
            </button>
          </div>
        )}

        {/* ── Step 2b: Quote list ─────────────────────────────────────────── */}
        {step === 'quote' && (
          <div className="px-4 pt-5 pb-32 space-y-4">
            {quotes.map((entry, index) => (
              <div key={entry.key}>
                {/* Entry header */}
                {quotes.length > 1 && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      인용구 {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeQuote(entry.key)}
                      className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      aria-label="삭제"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Page + date row */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field>
                    <FieldLabel htmlFor={`quote-page-${entry.key}`}>
                      {messages.books.fields.pageNumber}
                    </FieldLabel>
                    <Input
                      id={`quote-page-${entry.key}`}
                      type="number"
                      value={entry.page}
                      onChange={e => updateQuote(entry.key, { page: e.target.value })}
                      placeholder="—"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`quote-date-${entry.key}`}>
                      {messages.books.logFlow.date}
                    </FieldLabel>
                    <DatePicker
                      id={`quote-date-${entry.key}`}
                      value={entry.date}
                      onChange={v => updateQuote(entry.key, { date: v })}
                    />
                  </Field>
                </div>

                {/* Quote textarea */}
                <Textarea
                  ref={index === 0 ? firstTextareaRef : undefined}
                  value={entry.text}
                  onChange={e => updateQuote(entry.key, { text: e.target.value })}
                  placeholder={messages.books.placeholders.quoteText}
                  rows={6}
                  className="resize-none text-sm leading-relaxed w-full"
                />

                {index < quotes.length - 1 && <div className="border-b border-border/40 mt-4" />}
              </div>
            ))}

            {/* Add another entry */}
            <button
              type="button"
              onClick={addQuote}
              className="w-full flex items-center justify-center gap-1.5 py-3.5 rounded-xl border border-dashed text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
              {messages.books.logFlow.addEntry}
            </button>
          </div>
        )}

        {/* ── Step 3: Done ────────────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center gap-8 px-8 py-16 text-center">
            <div className="space-y-3">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
              <p className="text-lg font-semibold">{messages.books.logFlow.completedTitle}</p>
              <p className="text-sm text-muted-foreground">{messages.books.success.recordSaved}</p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button variant="outline" className="h-12" onClick={onClose}>
                {messages.books.buttons.backToList}
              </Button>
              <Button
                className="h-12"
                onClick={() => {
                  onClose();
                  navigate(`/books/${reading_log.id}`);
                }}
              >
                {messages.books.logFlow.viewDetail}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky footer action ─────────────────────────────────────────── */}
      {step !== 'done' && (
        <div className="shrink-0 px-4 py-4 border-t bg-background">
          {step === 'initial' && (
            <Button
              className="w-full h-12 text-base font-medium"
              onClick={handleSave}
              disabled={!currentPage || isSubmitting}
            >
              {isSubmitting ? messages.common.states.loading : messages.common.buttons.save}
            </Button>
          )}

          {step === 'review' && (
            <Button className="w-full h-12 text-base font-medium" onClick={handleReviewNext}>
              {messages.common.buttons.next}
            </Button>
          )}

          {step === 'quote' && (
            <Button className="w-full h-12 text-base font-medium" onClick={handleQuoteNext}>
              {messages.common.buttons.next}
            </Button>
          )}
        </div>
      )}
    </>
  );
}
