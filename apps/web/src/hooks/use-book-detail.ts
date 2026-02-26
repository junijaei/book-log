/**
 * use-book-detail.ts
 *
 * Composite hook that co-locates data fetching and ownership/permission
 * derivation so book-detail.tsx is freed from both concerns.
 *
 * Returns:
 *   - record: the full ReadingRecord (undefined while loading)
 *   - isLoading: TanStack Query loading state
 *   - capabilities: explicit boolean flags derived from ownership
 */

import { useAuth } from '@/hooks/use-auth';
import { useReadingRecord } from './use-reading-records';

/** Explicit edit capabilities — passed downward as props instead of raw isOwner. */
export interface BookDetailCapabilities {
  /** Can edit inline metadata fields (status, rating, date range, visibility). */
  canEdit: boolean;
  /** Can delete the reading record. */
  canDelete: boolean;
  /** Can add/edit/delete quotes and reflections. */
  canAddContent: boolean;
}

export function useBookDetail(id: string) {
  const { data: record, isLoading } = useReadingRecord(id);
  const { user } = useAuth();

  const isOwner = !!record && user?.id === record.reading_log.user_id;

  const capabilities: BookDetailCapabilities = {
    canEdit: isOwner,
    canDelete: isOwner,
    canAddContent: isOwner,
  };

  return { record, isLoading, capabilities };
}
