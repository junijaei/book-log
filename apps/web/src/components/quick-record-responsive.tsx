/**
 * Quick Record Responsive Wrapper
 *
 * Platform shell around ReadingLogFlow:
 *   Mobile  → fixed full-viewport overlay (z-[60])
 *   Desktop → Dialog (custom, non-Radix)
 *
 * Both share the identical ReadingLogFlow inner step machine.
 * Includes an unsaved-changes AlertDialog guard and a popstate sentinel for
 * browser back-button interception (BrowserRouter-compatible alternative to
 * useBlocker, which requires a data router).
 */

import { messages } from '@/constants/messages';
import { useIsMobile } from '@/hooks';
import type { ReadingRecord } from '@/types';
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Dialog, DialogContent } from './ui/dialog';
import { ReadingLogFlow } from './reading-log-flow';

interface QuickRecordResponsiveProps {
  record: ReadingRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickRecordResponsive({ record, open, onOpenChange }: QuickRecordResponsiveProps) {
  const isMobile = useIsMobile();

  // Dirty state is reported upward from ReadingLogFlow
  const [isDirty, setIsDirty] = useState(false);

  // Whether the guard AlertDialog is visible
  const [showGuard, setShowGuard] = useState(false);

  // Reset dirty state when the panel closes
  useEffect(() => {
    if (!open) setIsDirty(false);
  }, [open]);

  // ── Popstate sentinel — intercepts browser back when open + dirty ────────
  // BrowserRouter does not support useBlocker (requires a data router).
  // Instead, push a sentinel history entry when dirty; intercept popstate
  // to re-push the sentinel and show the guard. The sentinel URL equals the
  // current URL, so no visible navigation occurs.
  useEffect(() => {
    if (!open || !isDirty) return;

    window.history.pushState({ __readingLogGuard: true }, '');

    const onPopState = () => {
      // Re-push sentinel so the user cannot escape with repeated back presses
      window.history.pushState({ __readingLogGuard: true }, '');
      setShowGuard(true);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [open, isDirty]);

  // ── Close request — show guard if dirty, otherwise close immediately ────
  const handleRequestClose = () => {
    if (isDirty) {
      setShowGuard(true);
    } else {
      onOpenChange(false);
    }
  };

  // ── Guard handlers ───────────────────────────────────────────────────────
  const handleConfirmLeave = () => {
    setShowGuard(false);
    setIsDirty(false);
    onOpenChange(false);
  };

  const handleCancelLeave = () => {
    setShowGuard(false);
    // Sentinel was already re-pushed in the popstate handler; no further action needed
  };

  // ── Shared inner flow ────────────────────────────────────────────────────
  const flow = (
    <ReadingLogFlow record={record} onClose={handleRequestClose} onDirtyChange={setIsDirty} />
  );

  // ── Guard dialog (Radix AlertDialog — cannot dismiss via Escape/backdrop) ─
  const guard = (
    <AlertDialog open={showGuard}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{messages.common.guard.title}</AlertDialogTitle>
          <AlertDialogDescription>{messages.common.messages.unsavedChanges}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelLeave}>
            {messages.common.guard.cancel}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmLeave}>
            {messages.common.guard.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // ── Mobile: full-viewport overlay ────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {open && (
          <div
            className="fixed inset-0 z-[60] bg-background flex flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label={messages.books.logFlow.title}
          >
            {flow}
          </div>
        )}
        {guard}
      </>
    );
  }

  // ── Desktop: Dialog ───────────────────────────────────────────────────────
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={v => {
          if (!v) handleRequestClose();
        }}
      >
        <DialogContent className="p-0 flex flex-col max-h-[85vh] overflow-hidden max-w-md">
          {flow}
        </DialogContent>
      </Dialog>
      {guard}
    </>
  );
}
