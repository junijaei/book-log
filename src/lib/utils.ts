import type { ReadingStatus } from '@/types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getReadingStatusLabel(readingStatus: ReadingStatus): string {
  switch (readingStatus) {
    case 'want_to_read':
      return '읽을 예정';
    case 'reading':
      return '읽는 중';
    case 'finished':
      return '완독';
    case 'abandoned':
      return '중단';
    default:
      return '';
  }
}
