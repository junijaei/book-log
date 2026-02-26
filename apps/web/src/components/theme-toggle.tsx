import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  if (typeof window === 'undefined') {
    return (
      <Button variant="ghost" size="icon" disabled>
        <span className="sr-only">Loading theme...</span>
      </Button>
    );
  }

  return (
    <div
      className={cn('flex items-stretch border border-input rounded-md bg-muted-foreground/30')}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      <div
        className={cn(
          'size-8 p-2 rounded-md',
          resolvedTheme === 'dark' ? 'text-muted-foreground/60' : 'bg-background'
        )}
      >
        <Sun className={cn('size-4')} />
      </div>
      <div
        className={cn(
          'size-8 p-2 rounded-md',
          resolvedTheme === 'light' ? 'text-muted-foreground/60' : 'bg-background'
        )}
      >
        <Moon className={cn('size-4')} />
      </div>
    </div>
  );
}
