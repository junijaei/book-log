/**
 * reflections-section.tsx
 *
 * Self-contained reflections (reviews) CRUD section.
 * The same component renders for both owners and viewers — edit controls
 * are injected via canAddContent/canEdit props rather than isOwner checks.
 */

import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { messages } from '@/constants/messages';
import { useReviewMutations } from '@/hooks/use-review-mutations';
import type { Review } from '@/types';
import { NotebookText } from 'lucide-react';

interface ReflectionsSectionProps {
  reviews: Review[];
  readingLogId: string;
  canAddContent: boolean;
  canEdit: boolean;
}

export function ReflectionsSection({
  reviews,
  readingLogId,
  canAddContent,
  canEdit,
}: ReflectionsSectionProps) {
  const {
    showAddReview,
    setShowAddReview,
    newReviewContent,
    setNewReviewContent,
    editingReview,
    setEditingReview,
    editReviewContent,
    setEditReviewContent,
    deleteReviewDialogOpen,
    setDeleteReviewDialogOpen,
    setReviewToDelete,
    createIsPending,
    updateIsPending,
    deleteIsPending,
    handleAddReview,
    handleUpdateReview,
    handleDeleteReview,
  } = useReviewMutations(readingLogId);

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {messages.books.reflections.sectionTitle}
          <span className="text-muted-foreground font-normal ml-2">({reviews.length})</span>
        </h2>
        {canAddContent && (
          <Button variant="outline" size="sm" onClick={() => setShowAddReview(!showAddReview)}>
            {showAddReview ? messages.common.buttons.cancel : messages.books.buttons.addReflection}
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
              disabled={!newReviewContent.trim() || createIsPending}
            >
              {createIsPending ? messages.common.states.loading : messages.common.buttons.add}
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

      {/* Review list */}
      {reviews.length > 0 ? (
        <div className="divide-y divide-border/30">
          {reviews.map(review => (
            <article key={review.id} className="group py-3">
              <p className="text-sm leading-relaxed whitespace-pre-wrap mb-2">{review.content}</p>
              <div className="flex justify-between items-center">
                <time className="text-xs text-muted-foreground tabular-nums">
                  {review.reviewed_at ?? '—'}
                </time>
                {canEdit && (
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
                      disabled={deleteIsPending}
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
              disabled={updateIsPending}
            >
              {messages.common.buttons.cancel}
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateReview}
              disabled={!editReviewContent.trim() || updateIsPending}
            >
              {updateIsPending ? messages.common.buttons.saving : messages.common.buttons.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete reflection confirm ── */}
      <ConfirmDialog
        open={deleteReviewDialogOpen}
        onOpenChange={setDeleteReviewDialogOpen}
        title={messages.books.reflections.delete}
        description={messages.books.confirmations.deleteReflection}
        confirmLabel={messages.common.buttons.delete}
        variant="destructive"
        isPending={deleteIsPending}
        onConfirm={handleDeleteReview}
        onCancel={() => setReviewToDelete(null)}
      />
    </section>
  );
}
