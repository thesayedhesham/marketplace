import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, getCurrentProfile, updateProfile, getAllProfiles } from '@/services/profile-service';
import type { User } from '@/types';

export const profileKeys = {
  all: ['profiles'] as const,
  current: () => [...profileKeys.all, 'current'] as const,
  detail: (id: string) => [...profileKeys.all, id] as const,
};

export function useCurrentProfile() {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: getCurrentProfile,
  });
}

export function useProfile(userId: string) {
  return useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: () => getProfile(userId),
    enabled: !!userId,
  });
}

export function useAllProfiles() {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: getAllProfiles,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<User> }) =>
      updateProfile(userId, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.userId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.current() });
    },
  });
}
