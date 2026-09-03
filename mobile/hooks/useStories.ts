import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useStories() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      const res = await api.get('/stories');
      return res.data?.data || [];
    },
  });

  const createStoryMutation = useMutation({
    mutationFn: async (data: {
      media_url: string;
      media_type: 'image' | 'video';
      caption?: string;
      text_overlay?: any;
    }) => {
      const res = await api.post('/stories', data);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });

  const viewStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      await api.post(`/stories/${storyId}/view`);
    },
  });

  return {
    stories: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    createStory: createStoryMutation.mutateAsync,
    isCreating: createStoryMutation.isPending,
    viewStory: viewStoryMutation.mutate,
  };
}
