import { getReadingStatusLabel } from '@/lib/constants';
import type { ReadingStatus } from '@/types';
import { Badge } from './ui/badge';

interface StatusBadgeProps {
  status: ReadingStatus;
}

const statusVariants: Record<ReadingStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  want_to_read: 'outline',
  reading: 'default',
  finished: 'secondary',
  abandoned: 'destructive',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={statusVariants[status]}>{getReadingStatusLabel(status)}</Badge>;
}
