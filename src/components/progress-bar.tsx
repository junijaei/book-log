import { FIELD_LABELS, formatPageProgress, formatPercentage } from '@/lib/constants';

interface ProgressBarProps {
  currentPage: number | null;
  totalPages: number | null;
  showLabel?: boolean;
}

export function ProgressBar({ currentPage, totalPages, showLabel = true }: ProgressBarProps) {
  if (!currentPage || !totalPages) return null;

  const progress = Math.round((currentPage / totalPages) * 100);

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">{FIELD_LABELS.PROGRESS}</span>
          <span className="text-muted-foreground">
            {formatPageProgress(currentPage, totalPages)} ({formatPercentage(currentPage, totalPages)})
          </span>
        </div>
      )}
      <div className="w-full bg-secondary rounded-full h-3">
        <div
          className="bg-primary h-3 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
