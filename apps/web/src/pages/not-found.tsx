import { messages } from '@/constants/messages';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground mb-2">404</h1>
        <p className="text-lg text-muted-foreground mb-6">{messages.common.errorPages.notFoundTitle}</p>
        <Link to="/">
          <Button>{messages.common.errorPages.notFoundBack}</Button>
        </Link>
      </div>
    </div>
  );
}
