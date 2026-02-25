/**
 * editable-field.tsx
 *
 * Two exports that together form the "Book Detail" editing abstraction layer:
 *
 *  EditableField
 *    Encapsulates the four conditional concerns that repeat across every
 *    editable metadata field:
 *      - isOwner   → who can edit
 *      - isMobile  → which interaction (inline control vs. Drawer)
 *      - isSaving  → loading / disabled indicator
 *      - isEmpty   → handled by the caller via readView / mobileTrigger
 *
 *    Non-owner  → read-only readView
 *    Owner, desktop → desktopEdit rendered inline
 *    Owner, mobile  → tappable mobileTrigger that opens a Vaul Drawer
 *
 *  DateRangeDrawerCalendar
 *    Single-month Calendar for use inside a mobile Drawer.
 *    Auto-closes once both dates are selected.
 *    Intended to be passed as the drawerContent of an EditableField.
 */

import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import { Drawer } from 'vaul';

// ─── EditableField ────────────────────────────────────────────────────────────

interface EditableFieldProps {
  /** Whether the current user owns this record. */
  isOwner: boolean;
  /** Whether the device is mobile (drives the edit interaction). */
  isMobile: boolean;
  /** Show a saving spinner next to the field. */
  isSaving?: boolean;

  /**
   * Content shown to non-owners (read-only).
   * On mobile, also serves as the tap-trigger for owners unless
   * mobileTrigger is provided.
   * Pass `null` to render nothing for non-owners when the value is empty.
   */
  readView: React.ReactNode;

  /**
   * Override for the mobile tap-trigger content shown to owners.
   * Use when the empty-state needs a different visual than readView
   * (e.g. a placeholder label when no value is set yet).
   */
  mobileTrigger?: React.ReactNode;

  /** Desktop edit control rendered directly for owners. */
  desktopEdit: React.ReactNode;

  /**
   * Short label used as:
   *   - aria-label on the mobile trigger button
   *   - title inside the Drawer
   */
  label: string;

  /**
   * Content rendered inside the mobile Drawer.
   * Receives an onClose() callback to dismiss the Drawer programmatically
   * (e.g. after a selection is committed).
   */
  drawerContent: (onClose: () => void) => React.ReactNode;

  className?: string;
}

export function EditableField({
  isOwner,
  isMobile,
  isSaving,
  readView,
  mobileTrigger,
  desktopEdit,
  label,
  drawerContent,
  className,
}: EditableFieldProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const close = () => setDrawerOpen(false);

  const spinner = isSaving ? (
    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground shrink-0" />
  ) : null;

  // ── Non-owner: read-only ─────────────────────────────────────────────────
  if (!isOwner) {
    if (!readView) return null;
    return <span className={cn('flex items-center gap-1', className)}>{readView}</span>;
  }

  // ── Owner on desktop: inline edit control ────────────────────────────────
  if (!isMobile) {
    return (
      <span className={cn('flex items-center gap-1', className)}>
        {desktopEdit}
        {spinner}
      </span>
    );
  }

  // ── Owner on mobile: tappable trigger + Vaul Drawer ──────────────────────
  const trigger = mobileTrigger ?? readView;

  return (
    <span className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label={label}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        {trigger}
      </button>
      {spinner}

      <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background"
            aria-describedby={undefined}
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted" />
            <div className="p-4 pt-3 overflow-hidden">
              <Drawer.Title className="text-base font-semibold mb-4">{label}</Drawer.Title>
              {drawerContent(close)}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </span>
  );
}

// ─── DateRangeDrawerCalendar ──────────────────────────────────────────────────

export interface DateRangeValue {
  from?: string; // ISO date string YYYY-MM-DD
  to?: string;
}

interface DateRangeDrawerCalendarProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  /** Called when both dates are selected (auto-close hook). */
  onClose: () => void;
}

/**
 * A single-month Calendar intended to be rendered inside a mobile Drawer
 * via EditableField's drawerContent prop.
 *
 * Calls onChange on every partial update, and auto-closes the Drawer
 * once both start and end dates are committed.
 */
export function DateRangeDrawerCalendar({
  value,
  onChange,
  onClose,
}: DateRangeDrawerCalendarProps) {
  const [localRange, setLocalRange] = React.useState<DateRange | undefined>(() => {
    if (!value.from) return undefined;
    return {
      from: parse(value.from, 'yyyy-MM-dd', new Date()),
      to: value.to ? parse(value.to, 'yyyy-MM-dd', new Date()) : undefined,
    };
  });

  const handleSelect = (range: DateRange | undefined) => {
    setLocalRange(range);
    if (range?.from) {
      const patch: DateRangeValue = {
        from: format(range.from, 'yyyy-MM-dd'),
        to: range.to ? format(range.to, 'yyyy-MM-dd') : undefined,
      };
      onChange(patch);
      if (patch.to) onClose();
    } else {
      onChange({ from: undefined, to: undefined });
    }
  };

  return (
    <Calendar
      mode="range"
      selected={localRange}
      onSelect={handleSelect}
      numberOfMonths={1}
      className="mx-auto"
    />
  );
}
