import { messages } from '@/constants/messages';
import { cn } from '@/lib/utils';
import { Link, useRouterState } from '@tanstack/react-router';
import { BookOpen, Rss, User } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/' as const, label: messages.common.navigation.myBooks, icon: BookOpen },
  { to: '/feed' as const, label: messages.common.navigation.feed, icon: Rss },
  { to: '/mypage' as const, label: messages.common.navigation.myPage, icon: User },
];

export function BottomNav() {
  const pathname = useRouterState({ select: s => s.location.pathname });

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
