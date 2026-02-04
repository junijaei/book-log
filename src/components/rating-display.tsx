import { renderRatingStars } from '@/lib/constants';

interface RatingDisplayProps {
  rating: number;
  label?: string;
}

export function RatingDisplay({ rating, label = '평점' }: RatingDisplayProps) {
  return (
    <div>
      <span className="font-medium text-sm">{label}: </span>
      <span className="text-muted-foreground">{renderRatingStars(rating)}</span>
    </div>
  );
}
