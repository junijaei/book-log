import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile, getPublicProfile, searchUsers, updateProfile } from '@/api';
import { queryKeys } from '@/lib/query-keys';
import type { UpdateProfilePayload } from '@/types';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: getProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.profile.all,
      });
    },
  });
}

export function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.profile.public(userId),
    queryFn: () => getPublicProfile(userId),
    enabled: !!userId,
  });
}

export function useSearchUsers(search: string, limit = 10) {
  return useQuery({
    queryKey: queryKeys.profile.search(search),
    queryFn: () => searchUsers(search, limit),
    enabled: search.length >= 2,
  });
}
