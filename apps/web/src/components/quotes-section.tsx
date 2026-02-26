/**
 * quotes-section.tsx
 *
 * Self-contained quotes CRUD section.
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
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { messages } from '@/constants/messages';
import { useQuoteMutations } from '@/hooks/use-quote-mutations';
import type { Quote } from '@/types';
import { Quote as QuoteIcon } from 'lucide-react';

interface QuotesSectionProps {
  quotes: Quote[];
  readingLogId: string;
  canAddContent: boolean;
  canEdit: boolean;
}

export function QuotesSection({
  quotes,
  readingLogId,
  canAddContent,
  canEdit,
}: QuotesSectionProps) {
  const {
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
    setQuoteToDelete,
    createIsPending,
    updateIsPending,
    deleteIsPending,
    handleAddQuote,
    handleUpdateQuote,
    handleDeleteQuote,
  } = useQuoteMutations(readingLogId);

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">
          {messages.books.fields.quotes}
          <span className="text-muted-foreground font-normal ml-2">({quotes.length})</span>
        </h2>
        {canAddContent && (
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
                disabled={!newQuoteText.trim() || !newQuotePage || createIsPending}
              >
                {createIsPending ? messages.common.states.loading : messages.common.buttons.add}
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
                {canEdit && (
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
        !showAddQuote && (
          <EmptyState
            icon={<QuoteIcon size={48} strokeWidth={1} />}
            message={messages.books.quotes.empty}
          />
        )
      )}

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
              disabled={updateIsPending}
            >
              {messages.common.buttons.cancel}
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateQuote}
              disabled={!editQuoteText.trim() || !editQuotePage || updateIsPending}
            >
              {updateIsPending ? messages.common.buttons.saving : messages.common.buttons.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete quote confirm ── */}
      <ConfirmDialog
        open={deleteQuoteDialogOpen}
        onOpenChange={setDeleteQuoteDialogOpen}
        title={messages.books.quotes.delete}
        description={messages.books.confirmations.deleteQuote}
        confirmLabel={messages.common.buttons.delete}
        variant="destructive"
        isPending={deleteIsPending}
        onConfirm={handleDeleteQuote}
        onCancel={() => setQuoteToDelete(null)}
      />
    </section>
  );
}
