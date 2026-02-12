import { NAV_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { BookOpen, Rss, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: NAV_LABELS.MY_BOOKS, icon: BookOpen },
  { to: '/feed', label: NAV_LABELS.FEED, icon: Rss },
  { to: '/mypage', label: NAV_LABELS.MY_PAGE, icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);

          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={cn('leading-none', isActive && 'font-medium')}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
