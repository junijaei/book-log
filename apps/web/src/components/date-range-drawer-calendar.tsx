/**
 * date-range-drawer-calendar.tsx
 *
 * Single-month Calendar for use inside a mobile FieldDrawer.
 * Auto-closes once both dates are selected.
 */

import { Calendar } from '@/components/ui/calendar';
import { format, parse } from 'date-fns';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';

interface DateRangeValue {
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
 * A single-month Calendar intended to be rendered inside a mobile FieldDrawer.
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
