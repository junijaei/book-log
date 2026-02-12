import { format, parse } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DateRangeValue {
  from?: string; // ISO date string (YYYY-MM-DD)
  to?: string; // ISO date string (YYYY-MM-DD)
}

interface DateRangePickerProps {
  value?: DateRangeValue;
  onChange?: (value: DateRangeValue) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-invalid'?: boolean;
  className?: string;
}

const DateRangePicker = React.forwardRef<HTMLButtonElement, DateRangePickerProps>(
  ({ value, onChange, placeholder = '기간 선택', disabled, id, className, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);

    const dateRange = React.useMemo<DateRange | undefined>(() => {
      if (!value?.from && !value?.to) return undefined;
      return {
        from: value?.from ? parse(value.from, 'yyyy-MM-dd', new Date()) : undefined,
        to: value?.to ? parse(value.to, 'yyyy-MM-dd', new Date()) : undefined,
      };
    }, [value]);

    const handleSelect = (selected: DateRange | undefined) => {
      onChange?.({
        from: selected?.from ? format(selected.from, 'yyyy-MM-dd') : undefined,
        to: selected?.to ? format(selected.to, 'yyyy-MM-dd') : undefined,
      });
    };

    const formatDateRange = () => {
      if (!dateRange?.from) return null;

      if (dateRange.to) {
        return `${format(dateRange.from, 'yyyy.MM.dd', { locale: ko })} ~ ${format(dateRange.to, 'yyyy.MM.dd', { locale: ko })}`;
      }

      return format(dateRange.from, 'yyyy.MM.dd', { locale: ko });
    };

    const displayText = formatDateRange();

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            id={id}
            variant="outline"
            disabled={disabled}
            data-empty={!displayText}
            className={cn(
              'w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground',
              className
            )}
            {...props}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayText ?? <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    );
  }
);
DateRangePicker.displayName = 'DateRangePicker';

export { DateRangePicker };
