import { useRouterState } from '@tanstack/react-router';
import { useEffect } from 'react';

const scrollPositions = new Map<string, number>();

const PAGES_TO_RESTORE = ['/', '/feed'];

export function ScrollToTop() {
  const pathname = useRouterState({ select: s => s.location.pathname });

  useEffect(() => {
    if (PAGES_TO_RESTORE.includes(pathname)) {
      const savedPosition = scrollPositions.get(pathname) ?? 0;
      window.scrollTo(0, savedPosition);
    } else {
      window.scrollTo(0, 0);
    }

    return () => {
      scrollPositions.set(pathname, window.scrollY);
    };
  }, [pathname]);

  return null;
}
