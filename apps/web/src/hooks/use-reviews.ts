/**
 * Review Hooks
 *
 * TanStack Query mutations for review (reflection) CRUD operations.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReview, updateReview, deleteReview } from '@/api';
import { queryKeys } from '@/lib/query-keys';
import type { CreateReviewInput, UpdateReviewInput } from '@/types';

function useInvalidateAfterReview(readingLogId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.resetQueries({ queryKey: queryKeys.readingRecords.lists() });
    queryClient.invalidateQueries({
      queryKey: queryKeys.readingRecords.detail(readingLogId),
    });
  };
}

export function useCreateReview(readingLogId: string) {
  const invalidate = useInvalidateAfterReview(readingLogId);

  return useMutation({
    mutationFn: (input: CreateReviewInput) => createReview(input),
    onSuccess: invalidate,
  });
}

export function useUpdateReview(readingLogId: string) {
  const invalidate = useInvalidateAfterReview(readingLogId);

  return useMutation({
    mutationFn: (input: UpdateReviewInput) => updateReview(input),
    onSuccess: invalidate,
  });
}

export function useDeleteReview(readingLogId: string) {
  const invalidate = useInvalidateAfterReview(readingLogId);

  return useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId),
    onSuccess: invalidate,
  });
}
