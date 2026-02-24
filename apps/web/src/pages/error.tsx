import { messages } from '@/constants/messages';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground mb-2">오류</h1>
        <p className="text-lg text-muted-foreground mb-6">{messages.common.errorPages.errorTitle}</p>
        <Link to="/">
          <Button>{messages.common.errorPages.errorBack}</Button>
        </Link>
      </div>
    </div>
  );
}
