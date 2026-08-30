import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Post, Comment } from '../types/index.js';
import { triggerHeartBurst } from '../lib/utils.js';

export function usePosts(isExplore = false) {
  const queryClient = useQueryClient();
  const queryKey = isExplore ? ['posts', 'explore'] : ['posts', 'feed'];

  // Fetch Posts
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const endpoint = isExplore ? '/posts/explore' : '/posts';
      const res = await api.get(endpoint);
      return res.data?.data?.posts || [];
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  // Create Post Mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: {
      content_text: string;
      media_url?: string;
      media_type?: string;
      media_gallery?: string[];
      link_url?: string;
      visibility?: string;
    }) => {
      const res = await api.post('/posts', postData);
      return res.data?.data;
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData(queryKey, (old: Post[] | undefined) => {
        return old ? [newPost, ...old] : [newPost];
      });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Like / Unlike Post Mutation with Optimistic Update
  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean; event?: React.MouseEvent }) => {
      if (isLiked) {
        const res = await api.delete(`/posts/${postId}/like`);
        return { postId, liked: false, likes_count: res.data?.data?.likes_count };
      } else {
        const res = await api.post(`/posts/${postId}/like`);
        return { postId, liked: true, likes_count: res.data?.data?.likes_count };
      }
    },
    onMutate: async ({ postId, isLiked, event }) => {
      if (!isLiked) {
        triggerHeartBurst(event);
      }

      await queryClient.cancelQueries({ queryKey: ['posts'] });

      // Snapshot previous posts across all queries
      const previousFeed = queryClient.getQueryData<Post[]>(['posts', 'feed']);
      const previousExplore = queryClient.getQueryData<Post[]>(['posts', 'explore']);

      const updateList = (list: Post[] | undefined) =>
        list?.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              is_liked: !isLiked,
              likes_count: isLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1,
            };
          }
          return p;
        });

      queryClient.setQueryData(['posts', 'feed'], updateList);
      queryClient.setQueryData(['posts', 'explore'], updateList);

      return { previousFeed, previousExplore };
    },
    onError: (err, variables, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(['posts', 'feed'], context.previousFeed);
      }
      if (context?.previousExplore) {
        queryClient.setQueryData(['posts', 'explore'], context.previousExplore);
      }
    },
  });

  // Delete Post Mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await api.delete(`/posts/${postId}`);
      return res.data;
    },
    onSuccess: (data, postId) => {
      const removePost = (list: Post[] | undefined) => list?.filter((p) => p.id !== postId);
      queryClient.setQueryData(['posts', 'feed'], removePost);
      queryClient.setQueryData(['posts', 'explore'], removePost);
    },
  });

  return {
    posts: (data as Post[]) || [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    createPost: createPostMutation.mutateAsync,
    isCreating: createPostMutation.isPending,
    toggleLike: toggleLikeMutation.mutate,
    deletePost: deletePostMutation.mutateAsync,
  };
}
