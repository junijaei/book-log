import { messages } from '@/constants/messages';
import { cn } from '@/lib/utils';
import type { ReadingStatus } from '@/types';
import { Badge, type BadgeProps } from './ui/badge';

interface StatusBadgeProps {
  status: ReadingStatus;
}

const statusVariants: Record<
  ReadingStatus,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }
> = {
  want_to_read: {
    variant: 'default',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  reading: {
    variant: 'default',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  finished: {
    variant: 'default',
    className: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  },
  abandoned: {
    variant: 'default',
    className: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  },
};

export function StatusBadge({ status, className, ...rest }: StatusBadgeProps & BadgeProps) {
  return (
    <Badge
      variant={statusVariants[status].variant}
      className={cn(statusVariants[status].className, className, 'opacity-90')}
      {...rest}
    >
      {messages.books.status[status]}
    </Badge>
  );
}
