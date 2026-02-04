import { FIELD_LABELS } from '@/lib/constants';

interface DateRangeDisplayProps {
  startDate: string | null;
  endDate: string | null;
}

export function DateRangeDisplay({ startDate, endDate }: DateRangeDisplayProps) {
  if (!startDate && !endDate) return null;

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
