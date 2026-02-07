import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile } from '@/api';
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
