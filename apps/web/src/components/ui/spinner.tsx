import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-3 h-3',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return <Loader2 className={cn('animate-spin text-muted-foreground', sizeMap[size], className)} />;
}
