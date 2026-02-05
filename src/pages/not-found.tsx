import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground mb-2">404</h1>
        <p className="text-lg text-muted-foreground mb-6">페이지를 찾을 수 없습니다</p>
        <Link to="/">
          <Button>메인 화면으로</Button>
        </Link>
      </div>
    </div>
  );
}
