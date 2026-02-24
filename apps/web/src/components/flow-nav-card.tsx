import { CheckCircle2, ChevronRight, Circle } from 'lucide-react';

interface FlowNavCardProps {
  label: string;
  done: boolean;
  countLabel?: string;
  onClick: () => void;
}

export function FlowNavCard({ label, done, countLabel, onClick }: FlowNavCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-4 rounded-xl border bg-card hover:bg-accent/40 transition-colors"
    >
      <div className="flex items-center gap-3">
        {done ? (
          <CheckCircle2 className="w-5 h-5 text-primary" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground" />
        )}
        <span className="font-medium">{label}</span>
        {countLabel && <span className="text-xs text-muted-foreground">{countLabel}</span>}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}
