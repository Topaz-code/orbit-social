import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Group } from '../types/index.js';

export function useGroups() {
  const queryClient = useQueryClient();

  const { data: myGroups, isLoading: isLoadingMyGroups, refetch: refetchMyGroups } = useQuery({
    queryKey: ['groups', 'my'],
    queryFn: async () => {
      const res = await api.get('/groups');
      return (res.data?.data || []) as Group[];
    },
  });

  const { data: discoverGroups, isLoading: isLoadingDiscover, refetch: refetchDiscover } = useQuery({
    queryKey: ['groups', 'discover'],
    queryFn: async () => {
      const res = await api.get('/groups/discover');
      return (res.data?.data || []) as Group[];
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      avatar_url?: string;
      cover_url?: string;
      privacy?: 'public' | 'private';
      initial_member_ids?: string[];
    }) => {
      const res = await api.post('/groups', data);
      return res.data?.data as Group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const res = await api.post(`/groups/${groupId}/join`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const res = await api.post(`/groups/${groupId}/leave`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  return {
    myGroups: myGroups || [],
    discoverGroups: discoverGroups || [],
    isLoading: isLoadingMyGroups || isLoadingDiscover,
    createGroup: createGroupMutation.mutateAsync,
    isCreating: createGroupMutation.isPending,
    joinGroup: joinGroupMutation.mutateAsync,
    isJoining: joinGroupMutation.isPending,
    leaveGroup: leaveGroupMutation.mutateAsync,
    refetchMyGroups,
    refetchDiscover,
  };
}
