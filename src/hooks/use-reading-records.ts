import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createBook,
  createQuote,
  deleteQuote,
  deleteReadingRecord,
  getReadingRecord,
  getReadingRecords,
  updateQuote,
  upsertReadingRecord,
} from '@/api';
import { queryKeys } from '@/lib/query-keys';
import type {
  CreateBookInput,
  CreateQuoteInput,
  DeleteQuoteInput,
  DeleteReadingRecordInput,
  ReadingRecordFilters,
  ReadingRecordSort,
  UpdateQuoteInput,
  UpsertPayload,
} from '@/types';

const DEFAULT_PAGE_SIZE = 10;

export function useReadingRecords(filters?: ReadingRecordFilters, sort?: ReadingRecordSort) {
  return useInfiniteQuery({
    queryKey: queryKeys.readingRecords.list(filters, sort),
    queryFn: ({ pageParam }) =>
      getReadingRecords(filters, sort, {
        cursor: pageParam,
        limit: DEFAULT_PAGE_SIZE,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => (lastPage.has_more ? lastPage.next_cursor : undefined),
  });
}

export function useReadingRecord(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.readingRecords.detail(id ?? ''),
    queryFn: () => getReadingRecord(id!),
    enabled: !!id,
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBookInput) => createBook(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.readingRecords.all });
    },
  });
}

export function useUpsertReadingRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertPayload) => upsertReadingRecord(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.readingRecords.all });
      if (variables.reading_log.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.readingRecords.detail(variables.reading_log.id),
        });
      }
    },
  });
}

export function useDeleteReadingRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteReadingRecordInput) => deleteReadingRecord(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.readingRecords.all });
    },
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateQuoteInput) => createQuote(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.readingRecords.detail(variables.reading_log_id),
      });
    },
  });
}

export function useUpdateQuote(readingLogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateQuoteInput) => updateQuote(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.readingRecords.detail(readingLogId),
      });
    },
  });
}

export function useDeleteQuote(readingLogId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteQuoteInput) => deleteQuote(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.readingRecords.detail(readingLogId),
      });
    },
  });
}
