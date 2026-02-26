import { messages } from '@/constants/messages';
import { cn } from '@/lib/utils';
import type { Visibility } from '@/types';
import { Badge, type BadgeProps } from './ui/badge';

interface VisibilityBadgeProps {
  visibility: Visibility;
}

const VisibilityVariants: Record<
  Visibility,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }
> = {
  public: {
    variant: 'outline',
    className: '',
  },
  friends: {
    variant: 'secondary',
    className: '',
  },
  private: {
    variant: 'default',
    className: '',
  },
};

export function VisibilityBadge({
  visibility,
  className,
  ...rest
}: VisibilityBadgeProps & BadgeProps) {
  return (
    <Badge
      variant={VisibilityVariants[visibility].variant}
      className={cn(VisibilityVariants[visibility].className, className, 'opacity-90')}
      {...rest}
    >
      {messages.books.visibility[visibility]}
    </Badge>
  );
}
