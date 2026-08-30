import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { UserStoryGroup, Story } from '../types/index.js';

export function useStories() {
  const queryClient = useQueryClient();

  const {
    data: storyGroups,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      const res = await api.get('/stories');
      return (res.data?.data || []) as UserStoryGroup[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const createStoryMutation = useMutation({
    mutationFn: async (storyData: {
      media_url: string;
      media_type?: string;
      caption?: string;
      text_overlay?: any;
    }) => {
      const res = await api.post('/stories', storyData);
      return res.data?.data as Story;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });

  const markAsViewed = async (storyId: string) => {
    try {
      await api.post(`/stories/${storyId}/view`);
    } catch {
      // Ignored
    }
  };

  const deleteStory = async (storyId: string) => {
    await api.delete(`/stories/${storyId}`);
    queryClient.invalidateQueries({ queryKey: ['stories'] });
  };

  return {
    storyGroups: storyGroups || [],
    isLoading,
    refetch,
    createStory: createStoryMutation.mutateAsync,
    isCreating: createStoryMutation.isPending,
    markAsViewed,
    deleteStory,
  };
}
