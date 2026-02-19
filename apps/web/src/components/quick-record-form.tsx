/**
 * Quick Record Form
 *
 * Inner form for logging today's reading session.
 * Used inside both the mobile drawer and the desktop dialog.
 */

import { messages } from '@/constants/messages';
import { useCreateQuote, useCreateReview, useUpsertReadingRecord } from '@/hooks';
import type { ReadingRecord, UpsertPayload, Visibility } from '@/types';
import confetti from 'canvas-confetti';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Field, FieldLabel } from './ui/field';

interface QuickRecordFormProps {
  record: ReadingRecord;
  onSuccess: () => void;
  onCancel: () => void;
}

function buildUpsertPayload(record: ReadingRecord, currentPage: number): UpsertPayload {
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
  };
}

export function QuickRecordForm({ record, onSuccess, onCancel }: QuickRecordFormProps) {
  const { book, reading_log } = record;

  const [currentPage, setCurrentPage] = useState(reading_log.current_page?.toString() ?? '');
  const [reflection, setReflection] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const upsertMutation = useUpsertReadingRecord();
  const createReviewMutation = useCreateReview(reading_log.id);
  const createQuoteMutation = useCreateQuote();

  const totalPages = book.total_pages;
  const previousPage = reading_log.current_page ?? 0;
  const isAlreadyFinished = reading_log.status === 'finished';

  const handlePageBlur = () => {
    if (!currentPage) return;
    const parsed = parseInt(currentPage);
    if (totalPages && parsed > totalPages) {
      setCurrentPage(totalPages.toString());
    }
  };

  const handleMarkCompleted = async () => {
    const today = new Date().toISOString().split('T')[0];
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

  const handleSubmit = async () => {
    if (!currentPage) return;

    const newPage = Math.min(parseInt(currentPage), totalPages ?? Number.MAX_SAFE_INTEGER);
    const today = new Date().toISOString().split('T')[0];

    setIsSubmitting(true);
    try {
      // 1. Update current_page
      await upsertMutation.mutateAsync(buildUpsertPayload(record, newPage));

      // 2. Save reflection (review)
      if (reflection.trim()) {
        await createReviewMutation.mutateAsync({
          reading_log_id: reading_log.id,
          content: reflection.trim(),
          page_number: newPage || null,
          reviewed_at: today,
        });
      }

      // 3. Save quote
      if (quoteText.trim()) {
        await createQuoteMutation.mutateAsync({
          reading_log_id: reading_log.id,
          text: quoteText.trim(),
          page_number: newPage,
          noted_at: today,
        });
      }

      toast.success(messages.books.success.recordSaved);

      // 4. Close drawer first, then fire celebration if reached the last page
      const shouldCelebrate =
        totalPages && newPage >= totalPages && previousPage < totalPages && !isAlreadyFinished;

      onSuccess();

      if (shouldCelebrate) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        // Render at root via sonner — no z-index conflicts with vaul drawer
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

  return (
    <div className="space-y-4">
      {/* Current page */}
      <Field>
        <FieldLabel htmlFor="quick-current-page">{messages.books.fields.currentPage}</FieldLabel>
        <div className="flex items-center gap-2">
          <Input
            id="quick-current-page"
            type="number"
            min="0"
            max={totalPages ?? undefined}
            value={currentPage}
            onChange={e => setCurrentPage(e.target.value)}
            onBlur={handlePageBlur}
            placeholder="0"
            className="w-28"
          />
          {totalPages && (
            <span className="text-sm text-muted-foreground">
              / {totalPages.toLocaleString()} {messages.books.details.pagesUnit}
            </span>
          )}
        </div>
      </Field>

      {/* Reflection */}
      <Field>
        <FieldLabel htmlFor="quick-reflection">
          {messages.books.fields.reflection}{' '}
          <span className="text-muted-foreground font-normal text-xs">(선택)</span>
        </FieldLabel>
        <Textarea
          id="quick-reflection"
          rows={3}
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          placeholder={messages.books.fields.reflectionContent}
          className="text-sm leading-relaxed resize-none"
        />
      </Field>

      {/* Quote */}
      <Field>
        <FieldLabel htmlFor="quick-quote">
          {messages.books.fields.quoteText}{' '}
          <span className="text-muted-foreground font-normal text-xs">(선택)</span>
        </FieldLabel>
        <Textarea
          id="quick-quote"
          rows={2}
          value={quoteText}
          onChange={e => setQuoteText(e.target.value)}
          placeholder={messages.books.placeholders.quoteText}
          className="text-sm leading-relaxed resize-none"
        />
      </Field>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSubmit} disabled={!currentPage || isSubmitting} className="flex-1">
          {isSubmitting ? messages.common.states.loading : messages.common.buttons.save}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {messages.common.buttons.cancel}
        </Button>
      </div>
    </div>
  );
}
