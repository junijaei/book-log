/**
 * ConfirmDialog
 *
 * Unified confirmation modal that replaces all inline AlertDialog usage.
 * Enforces consistent button order (Cancel left, Confirm right),
 * semantic variants, and pending-state handling across the app.
 */

import { messages } from '@/constants/messages';
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
import { Spinner } from './ui/spinner';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Label for the confirm/action button */
  confirmLabel: string;
  /** Label for the cancel button. Defaults to common cancel text. */
  cancelLabel?: string;
  /**
   * - `destructive` → red button (irreversible data deletion)
   * - `warning`     → amber button (navigation away from unsaved state)
   * - `default`     → primary brand button (positive actions)
   */
  variant?: 'destructive' | 'warning' | 'default';
  /** While true, both buttons are disabled and the confirm button shows a spinner. */
  isPending?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = messages.common.buttons.cancel,
  variant = 'default',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isPending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction variant={variant} onClick={onConfirm} disabled={isPending}>
            {isPending ? <Spinner size="sm" className="text-white" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
