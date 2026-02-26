/**
 * use-review-mutations.ts
 *
 * Encapsulates all review (reflection) CRUD state and async handlers.
 * Consumed by ReflectionsSection to keep book-detail.tsx thin.
 */

import { messages } from '@/constants/messages';
import type { Review } from '@/types';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateReview, useDeleteReview, useUpdateReview } from './use-reviews';

export function useReviewMutations(readingLogId: string) {
  // ── Add state ──
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReviewContent, setNewReviewContent] = useState('');

  // ── Edit state ──
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editReviewContent, setEditReviewContent] = useState('');

  // ── Delete state ──
  const [deleteReviewDialogOpen, setDeleteReviewDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);

  // ── Mutations ──
  const createReviewMutation = useCreateReview(readingLogId);
  const updateReviewMutation = useUpdateReview(readingLogId);
  const deleteReviewMutation = useDeleteReview(readingLogId);

  // ── Handlers ──

  const handleAddReview = async () => {
    if (!readingLogId || !newReviewContent.trim()) return;
    try {
      await createReviewMutation.mutateAsync({
        reading_log_id: readingLogId,
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

  return {
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
    reviewToDelete,
    setReviewToDelete,
    createIsPending: createReviewMutation.isPending,
    updateIsPending: updateReviewMutation.isPending,
    deleteIsPending: deleteReviewMutation.isPending,
    handleAddReview,
    handleUpdateReview,
    handleDeleteReview,
  };
}
