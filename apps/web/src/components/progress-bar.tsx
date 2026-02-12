import { FIELD_LABELS, formatPageProgress, formatPercentage } from '@/lib/constants';

interface ProgressBarProps {
  currentPage: number | null;
  totalPages: number | null;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ProgressBar({
  currentPage,
  totalPages,
  showLabel = true,
  size = 'md',
}: ProgressBarProps) {
  if (!currentPage || !totalPages) return null;

  const progress = Math.round((currentPage / totalPages) * 100);
  const barHeight = size === 'sm' ? 'h-2' : 'h-2.5';

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-muted-foreground">{FIELD_LABELS.PROGRESS}</span>
          <span className="text-muted-foreground">
            {formatPageProgress(currentPage, totalPages)} (
            {formatPercentage(currentPage, totalPages)})
          </span>
        </div>
      )}
      <div className={`w-full bg-secondary rounded-full ${barHeight}`}>
        <div
          className={`bg-primary ${barHeight} rounded-full transition-all`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
