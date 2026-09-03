import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam }) => {
      const url = pageParam ? `/posts?cursor=${pageParam}&limit=20` : '/posts?limit=20';
      const res = await api.get(url);
      return res.data?.data || { posts: [], nextCursor: null };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: any) => {
      return lastPage?.nextCursor || undefined;
    },
  });
}

export function useExploreFeed() {
  return useInfiniteQuery({
    queryKey: ['exploreFeed'],
    queryFn: async ({ pageParam }) => {
      const url = pageParam ? `/posts/explore?cursor=${pageParam}&limit=20` : '/posts/explore?limit=20';
      const res = await api.get(url);
      return res.data?.data || { posts: [], nextCursor: null };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: any) => {
      return lastPage?.nextCursor || undefined;
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      content_text?: string;
      media_url?: string;
      media_type?: string;
      media_gallery?: any[];
      link_url?: string;
      visibility?: string;
      group_id?: string;
    }) => {
      const res = await api.post('/posts', data);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['exploreFeed'] });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (isLiked) {
        await api.delete(`/posts/${postId}/like`);
      } else {
        await api.post(`/posts/${postId}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['exploreFeed'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      await api.delete(`/posts/${postId}`);
      return postId;
    },
    onSuccess: () => {
      // Refresh feed / explore / any single-post queries after removal.
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['exploreFeed'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, content_text }: { postId: string; content_text: string }) => {
      const res = await api.put(`/posts/${postId}`, { content_text });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['exploreFeed'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });
}
