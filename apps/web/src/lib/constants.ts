import { messages } from '@/constants/messages';
import type { ReadingStatus, Visibility } from '@/types';

// ============================================================
// HELPER FUNCTIONS ONLY
// All UI text messages have been moved to /src/constants/messages/
// ============================================================

/**
 * Get reading status label from messages
 */
export function getReadingStatusLabel(status: ReadingStatus): string {
  return messages.books.status[status];
}

/**
 * Get visibility label from messages
 */
export function getVisibilityLabel(visibility: Visibility): string {
  return messages.books.visibility[visibility];
}

/**
 * Format page progress display (e.g., "42 / 300 페이지")
 */
export function formatPageProgress(currentPage: number | null, totalPages: number | null): string {
  if (!currentPage || !totalPages) return '';
  return `${currentPage} / ${totalPages} ${messages.books.details.pagesUnit}`;
}

/**
 * Format percentage (e.g., "75%")
 */
export function formatPercentage(current: number, total: number): string {
  return `${Math.round((current / total) * 100)}%`;
}

/**
 * Format date range display (e.g., "2024-01-01 ~ 2024-02-01")
 */
export function formatDateRange(startDate: string | null, endDate: string | null): string | null {
  const dates = [startDate, endDate].filter(Boolean);
  return dates.length > 0 ? dates.join(' ~ ') : null;
}

/**
 * Render rating as stars (e.g., "★★★☆☆" for rating 3)
 */
export function renderRatingStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}
