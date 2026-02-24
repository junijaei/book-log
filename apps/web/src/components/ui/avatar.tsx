import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
} as const;

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-muted flex items-center justify-center font-medium text-muted-foreground flex-shrink-0',
        sizeClasses[size],
        className
      )}
    >
      {initial}
    </div>
  );
}
