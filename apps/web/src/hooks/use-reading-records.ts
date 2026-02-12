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
        offset: pageParam,
        limit: DEFAULT_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: lastPage => {
      const nextOffset = lastPage.meta.offset + lastPage.meta.count;
      return nextOffset < lastPage.meta.total ? nextOffset : undefined;
    },
  });
}

export function useReadingRecord(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.readingRecords.detail(id ?? ''),
    queryFn: () => getReadingRecord(id!),
    enabled: !!id,
  });
}

function useInvalidateReadingRecords() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.resetQueries({
      queryKey: queryKeys.readingRecords.lists(),
    });
  };
}

export function useCreateBook() {
  const invalidateRecords = useInvalidateReadingRecords();

  return useMutation({
    mutationFn: (input: CreateBookInput) => createBook(input),
    onSuccess: () => {
      invalidateRecords();
    },
  });
}

export function useUpsertReadingRecord() {
  const queryClient = useQueryClient();
  const invalidateRecords = useInvalidateReadingRecords();

  return useMutation({
    mutationFn: (payload: UpsertPayload) => upsertReadingRecord(payload),
    onSuccess: (_, variables) => {
      invalidateRecords();
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
  const invalidateRecords = useInvalidateReadingRecords();

  return useMutation({
    mutationFn: (input: DeleteReadingRecordInput) => deleteReadingRecord(input),
    onSuccess: (_, variables) => {
      invalidateRecords();
      queryClient.removeQueries({
        queryKey: queryKeys.readingRecords.detail(variables.reading_log_id),
      });
    },
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  const invalidateRecords = useInvalidateReadingRecords();

  return useMutation({
    mutationFn: (input: CreateQuoteInput) => createQuote(input),
    onSuccess: (_, variables) => {
      invalidateRecords();
      queryClient.invalidateQueries({
        queryKey: queryKeys.readingRecords.detail(variables.reading_log_id),
      });
    },
  });
}

export function useUpdateQuote(readingLogId: string) {
  const queryClient = useQueryClient();
  const invalidateRecords = useInvalidateReadingRecords();

  return useMutation({
    mutationFn: (input: UpdateQuoteInput) => updateQuote(input),
    onSuccess: () => {
      invalidateRecords();
      queryClient.invalidateQueries({
        queryKey: queryKeys.readingRecords.detail(readingLogId),
      });
    },
  });
}

export function useDeleteQuote(readingLogId: string) {
  const queryClient = useQueryClient();
  const invalidateRecords = useInvalidateReadingRecords();

  return useMutation({
    mutationFn: (quoteId: string) => deleteQuote(quoteId),
    onSuccess: () => {
      invalidateRecords();
      queryClient.invalidateQueries({
        queryKey: queryKeys.readingRecords.detail(readingLogId),
      });
    },
  });
}
