import { useAuth } from '@/hooks/use-auth';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { BookListSkeleton } from '@/components/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen pb-16">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
          <div className="container mx-auto px-4 py-3 max-w-6xl">
            <div className="flex justify-between items-center">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <BookListSkeleton />
        </div>
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
          <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
