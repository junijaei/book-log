import type { ReadingRecordFilters, ReadingRecordSort } from '@/types';

export const queryKeys = {
  readingRecords: {
    all: ['readingRecords'] as const,
    lists: () => [...queryKeys.readingRecords.all, 'list'] as const,
    list: (filters?: ReadingRecordFilters, sort?: ReadingRecordSort) =>
      [...queryKeys.readingRecords.lists(), { filters, sort }] as const,
    details: () => [...queryKeys.readingRecords.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.readingRecords.details(), id] as const,
  },
  books: {
    all: ['books'] as const,
  },
  quotes: {
    all: ['quotes'] as const,
    byReadingLog: (readingLogId: string) => [...queryKeys.quotes.all, readingLogId] as const,
  },
  profile: {
    all: ['profile'] as const,
    public: (userId: string) => ['profile', 'public', userId] as const,
    search: (term: string) => ['profile', 'search', term] as const,
  },
  friends: {
    all: ['friends'] as const,
    list: () => [...queryKeys.friends.all, 'list'] as const,
    received: () => [...queryKeys.friends.all, 'received'] as const,
    sent: () => [...queryKeys.friends.all, 'sent'] as const,
  },
} as const;
