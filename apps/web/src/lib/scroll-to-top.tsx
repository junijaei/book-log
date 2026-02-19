import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const scrollPositions = new Map<string, number>();

const PAGES_TO_RESTORE = ['/', '/feed']; // 복원 대상

export function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    const { pathname } = location;

    // 복원 대상이면 저장된 위치로 이동
    if (PAGES_TO_RESTORE.includes(pathname)) {
      const savedPosition = scrollPositions.get(pathname) ?? 0;
      window.scrollTo(0, savedPosition);
    } else {
      window.scrollTo(0, 0);
    }

    // 페이지 떠날 때 현재 위치 저장
    return () => {
      scrollPositions.set(pathname, window.scrollY);
    };
  }, [location]);

  return null;
}
