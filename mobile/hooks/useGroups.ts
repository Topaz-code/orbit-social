import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useGroups() {
  const queryClient = useQueryClient();

  const myGroupsQuery = useQuery({
    queryKey: ['myGroups'],
    queryFn: async () => {
      const res = await api.get('/groups');
      return res.data?.data || [];
    },
  });

  const discoverGroupsQuery = useQuery({
    queryKey: ['discoverGroups'],
    queryFn: async () => {
      const res = await api.get('/groups/discover');
      return res.data?.data || [];
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      avatar_url?: string;
      cover_url?: string;
      privacy?: 'public' | 'private';
    }) => {
      const res = await api.post('/groups', data);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      queryClient.invalidateQueries({ queryKey: ['discoverGroups'] });
    },
  });

  return {
    myGroups: myGroupsQuery.data || [],
    discoverGroups: discoverGroupsQuery.data || [],
    isLoading: myGroupsQuery.isLoading || discoverGroupsQuery.isLoading,
    refetch: () => {
      myGroupsQuery.refetch();
      discoverGroupsQuery.refetch();
    },
    createGroup: createGroupMutation.mutateAsync,
  };
}
