import { renderRatingStars } from '@/lib/constants';
import { messages } from '@/constants/messages';

interface RatingDisplayProps {
  rating: number;
  label?: string;
}

export function RatingDisplay({
  rating,
  label = messages.books.fields.rating,
}: RatingDisplayProps) {
  return (
    <div>
      <span className="font-medium text-sm">{label}: </span>
      <span className="text-muted-foreground">{renderRatingStars(rating)}</span>
    </div>
  );
}
