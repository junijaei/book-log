import { FIELD_LABELS } from '@/lib/constants';

interface DateRangeDisplayProps {
  startDate: string | null;
  endDate: string | null;
  variant?: 'default' | 'inline';
}

export function DateRangeDisplay({
  startDate,
  endDate,
  variant = 'default',
}: DateRangeDisplayProps) {
  if (!startDate && !endDate) return null;

  // Inline variant: compact, no labels
  if (variant === 'inline') {
    if (startDate && endDate) {
      return (
        <span>
          {startDate} ~ {endDate}
        </span>
      );
    }
    if (startDate) {
      return <span>{startDate} ~</span>;
    }
    return <span>~ {endDate}</span>;
  }

  // Default variant: with labels
  return (
    <div className="flex gap-6 text-sm">
      {startDate && (
        <div>
          <span className="font-medium">{FIELD_LABELS.START_DATE}: </span>
          <span className="text-muted-foreground">{startDate}</span>
        </div>
      )}
      {endDate && (
        <div>
          <span className="font-medium">{FIELD_LABELS.END_DATE}: </span>
          <span className="text-muted-foreground">{endDate}</span>
        </div>
      )}
    </div>
  );
}
