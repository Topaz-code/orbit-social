import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Post } from '../types/index.js';
import { PostCard } from '../components/feed/PostCard.js';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.js';
import { ArrowLeft } from 'lucide-react';

export const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch the individual post
  const { data, isLoading, error } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const res = await api.get(`/posts/${id}`);
      return res.data.data as Post;
    },
    enabled: !!id,
    retry: 1,
  });

  // Like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (isLiked) {
        await api.delete(`/posts/${postId}/like`);
      } else {
        await api.post(`/posts/${postId}/like`);
      }
    },
    onMutate: async ({ isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['post', id] });
      const previousPost = queryClient.getQueryData(['post', id]);
      
      queryClient.setQueryData(['post', id], (old: Post | undefined) => {
        if (!old) return old;
        return {
          ...old,
          is_liked: !isLiked,
          likes_count: isLiked ? Math.max(0, old.likes_count - 1) : old.likes_count + 1,
        };
      });
      return { previousPost };
    },
    onError: (_err, _newVal, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(['post', id], context.previousPost);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
    },
  });

  const handleToggleLike = (postId: string, isLiked: boolean, event: React.MouseEvent) => {
    event.stopPropagation();
    toggleLikeMutation.mutate({ postId, isLiked });
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await api.delete(`/posts/${postId}`);
      navigate('/');
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-[#D9D0B8] mb-4">Post not found</h2>
        <p className="text-[#7F8B86] mb-6">This post may have been deleted or is private.</p>
        <button 
          onClick={() => navigate(-1)}
          className="text-[#D0A56A] hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 w-full h-full overflow-y-auto">
      <div className="mb-6 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 mr-2 rounded-full hover:bg-[#202A2D] text-[#D9D0B8] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-[#D9D0B8]">Post</h1>
      </div>
      
      <PostCard 
        post={data} 
        onToggleLike={handleToggleLike} 
        onDeletePost={handleDeletePost}
      />
    </div>
  );
};
