import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  acceptFriendRequest,
  blockUser,
  deleteFriendship,
  listFriends,
  listReceivedRequests,
  listSentRequests,
  rejectFriendRequest,
  sendFriendRequest,
  unblockUser,
} from '@/api';
import { queryKeys } from '@/lib/query-keys';

const DEFAULT_PAGE_SIZE = 20;

function useInvalidateFriends() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.readingRecords.lists() });
  };
}

export function useFriendsList() {
  return useInfiniteQuery({
    queryKey: queryKeys.friends.list(),
    queryFn: ({ pageParam }) => listFriends(DEFAULT_PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: lastPage => {
      const nextOffset = lastPage.meta.offset + lastPage.meta.count;
      return nextOffset < lastPage.meta.total ? nextOffset : undefined;
    },
  });
}

export function useReceivedRequests() {
  return useInfiniteQuery({
    queryKey: queryKeys.friends.received(),
    queryFn: ({ pageParam }) => listReceivedRequests(DEFAULT_PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: lastPage => {
      const nextOffset = lastPage.meta.offset + lastPage.meta.count;
      return nextOffset < lastPage.meta.total ? nextOffset : undefined;
    },
  });
}

export function useSentRequests() {
  return useInfiniteQuery({
    queryKey: queryKeys.friends.sent(),
    queryFn: ({ pageParam }) => listSentRequests(DEFAULT_PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: lastPage => {
      const nextOffset = lastPage.meta.offset + lastPage.meta.count;
      return nextOffset < lastPage.meta.total ? nextOffset : undefined;
    },
  });
}

export function useSendFriendRequest() {
  const invalidate = useInvalidateFriends();

  return useMutation({
    mutationFn: (targetUserId: string) => sendFriendRequest(targetUserId),
    onSuccess: invalidate,
  });
}

export function useAcceptFriendRequest() {
  const invalidate = useInvalidateFriends();

  return useMutation({
    mutationFn: (friendshipId: string) => acceptFriendRequest(friendshipId),
    onSuccess: invalidate,
  });
}

export function useRejectFriendRequest() {
  const invalidate = useInvalidateFriends();

  return useMutation({
    mutationFn: (friendshipId: string) => rejectFriendRequest(friendshipId),
    onSuccess: invalidate,
  });
}

export function useDeleteFriendship() {
  const invalidate = useInvalidateFriends();

  return useMutation({
    mutationFn: (friendshipId: string) => deleteFriendship(friendshipId),
    onSuccess: invalidate,
  });
}

export function useBlockUser() {
  const invalidate = useInvalidateFriends();

  return useMutation({
    mutationFn: (targetUserId: string) => blockUser(targetUserId),
    onSuccess: invalidate,
  });
}

export function useUnblockUser() {
  const invalidate = useInvalidateFriends();

  return useMutation({
    mutationFn: (targetUserId: string) => unblockUser(targetUserId),
    onSuccess: invalidate,
  });
}
