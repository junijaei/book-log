import { Badge } from './ui/badge';
import type { ReadingStatus } from '@/types';

interface StatusBadgeProps {
  status: ReadingStatus;
}

const statusConfig: Record<
  ReadingStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  want_to_read: { label: 'Want to Read', variant: 'outline' },
  reading: { label: 'Reading', variant: 'default' },
  finished: { label: 'Finished', variant: 'secondary' },
  abandoned: { label: 'Abandoned', variant: 'destructive' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
