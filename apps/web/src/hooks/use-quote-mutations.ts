/**
 * use-quote-mutations.ts
 *
 * Encapsulates all quote CRUD state and async handlers.
 * Consumed by QuotesSection to keep book-detail.tsx thin.
 */

import { messages } from '@/constants/messages';
import type { Quote } from '@/types';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateQuote, useDeleteQuote, useUpdateQuote } from './use-reading-records';

export function useQuoteMutations(readingLogId: string) {
  // ── Add state ──
  const [showAddQuote, setShowAddQuote] = useState(false);
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuotePage, setNewQuotePage] = useState('');

  // ── Edit state ──
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editQuoteText, setEditQuoteText] = useState('');
  const [editQuotePage, setEditQuotePage] = useState('');

  // ── Delete state ──
  const [deleteQuoteDialogOpen, setDeleteQuoteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);

  // ── Mutations ──
  const createQuoteMutation = useCreateQuote();
  const updateQuoteMutation = useUpdateQuote(readingLogId);
  const deleteQuoteMutation = useDeleteQuote(readingLogId);

  // ── Handlers ──

  const handleAddQuote = async () => {
    if (!readingLogId || !newQuoteText.trim() || !newQuotePage) return;
    try {
      await createQuoteMutation.mutateAsync({
        reading_log_id: readingLogId,
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

  return {
    showAddQuote,
    setShowAddQuote,
    newQuoteText,
    setNewQuoteText,
    newQuotePage,
    setNewQuotePage,
    editingQuote,
    setEditingQuote,
    editQuoteText,
    setEditQuoteText,
    editQuotePage,
    setEditQuotePage,
    deleteQuoteDialogOpen,
    setDeleteQuoteDialogOpen,
    quoteToDelete,
    setQuoteToDelete,
    createIsPending: createQuoteMutation.isPending,
    updateIsPending: updateQuoteMutation.isPending,
    deleteIsPending: deleteQuoteMutation.isPending,
    handleAddQuote,
    handleUpdateQuote,
    handleDeleteQuote,
  };
}
