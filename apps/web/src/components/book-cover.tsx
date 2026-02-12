import { MESSAGES } from '@/lib/constants';

interface BookCoverProps {
  url: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-20 h-28',
  md: 'w-32 h-44',
  lg: 'w-40 h-56',
};

export function BookCover({ url, alt, size = 'sm' }: BookCoverProps) {
  const sizeClass = sizeClasses[size];

  if (url) {
    return (
      <img src={url} alt={alt} className={`${sizeClass} object-cover rounded`} />
    );
  }

  return (
    <div
      className={`${sizeClass} bg-muted rounded flex items-center justify-center text-muted-foreground text-xs`}
    >
      {MESSAGES.NO_COVER}
    </div>
  );
}
