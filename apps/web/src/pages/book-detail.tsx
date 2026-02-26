/**
 * Book Detail Page
 *
 * Displays a full reading record with inline editing (Notion-style).
 * No separate edit page — all mutations happen in place.
 *
 * Mode is determined by ownership (via useBookDetail):
 *   - my-book  (isOwner): all inline edit controls active
 *   - others-book (viewer): strictly read-only throughout
 *
 * Editing capabilities flow downward as explicit props — no raw isOwner
 * conditionals scattered across the JSX tree.
 */

import { ConfirmDialog } from '@/components/confirm-dialog';
import { MyBookHeader } from '@/components/my-book-header';
import { OtherUserBookHeader } from '@/components/other-user-book-header';
import { PageHeader } from '@/components/page-header';
import { QuotesSection } from '@/components/quotes-section';
import { ReflectionsSection } from '@/components/reflections-section';
import { BookDetailSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { messages } from '@/constants/messages';
import { useDeleteReadingRecord, useUpsertReadingRecord } from '@/hooks';
import { useBookDetail } from '@/hooks/use-book-detail';
import type { ReadingRecord, ReadingStatus, UpsertPayload, Visibility } from '@/types';
import { getRouteApi, useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const Route = getRouteApi('/_authenticated/books/$id');

// ─── Upsert payload helper ────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BookDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const { record, isLoading, capabilities } = useBookDetail(id);

  // ── Mutations ──
  const upsertMutation = useUpsertReadingRecord();
  const deleteMutation = useDeleteReadingRecord();

  // ── Inline editing state ──
  const [savingField, setSavingField] = useState<string | null>(null);
  const [deleteRecordDialogOpen, setDeleteRecordDialogOpen] = useState(false);

  // ── Inline field handlers (status, rating, date range, visibility) ──
  // Each follows the same pattern: setSavingField → mutateAsync → toast → finally clear.

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

  // Shared core — called by both the mobile drawer picker and the desktop Select.
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

  const handleSaveVisibility = async (newVisibility: Visibility) => {
    if (!record) return;
    setSavingField('visibility');
    try {
      await upsertMutation.mutateAsync(buildPayload(record, { visibility: newVisibility }));
      toast.success(messages.common.success.savedSuccessfully);
    } catch (error) {
      console.error('Failed to save visibility:', error);
      toast.error(messages.common.errors.failedToSave);
    } finally {
      setSavingField(null);
    }
  };

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
            <Button
              variant="ghost"
              size="sm"
              className="px-0"
              onClick={() => router.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              {messages.common.buttons.back}
            </Button>
          }
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

  const { reading_log, quotes, reviews } = record;

  return (
    <div className="min-h-screen">
      <PageHeader
        maxWidth="max-w-4xl"
        left={
          <Button variant="ghost" size="sm" className="px-0" onClick={() => router.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            {messages.common.buttons.back}
          </Button>
        }
      />

      <main className="container mx-auto px-4 py-6 max-w-4xl animate-in fade-in-0 duration-300 space-y-8">
        {/* ── Book header panel ── */}
        {capabilities.canEdit ? (
          <MyBookHeader
            record={record}
            savingField={savingField}
            onSaveRating={handleSaveRatingValue}
            onSaveStatus={handleSaveStatus}
            onSaveDateRange={handleSaveDateRange}
            onSaveVisibility={handleSaveVisibility}
          />
        ) : (
          <OtherUserBookHeader record={record} />
        )}

        {/* ── Reflections section ── */}
        <ReflectionsSection
          reviews={reviews}
          readingLogId={reading_log.id}
          canAddContent={capabilities.canAddContent}
          canEdit={capabilities.canEdit}
        />

        {/* ── Quotes section ── */}
        <QuotesSection
          quotes={quotes}
          readingLogId={reading_log.id}
          canAddContent={capabilities.canAddContent}
          canEdit={capabilities.canEdit}
        />

        {/* ── Danger zone ── */}
        {capabilities.canDelete && (
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
