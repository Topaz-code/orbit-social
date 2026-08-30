import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { useAuthStore } from '../../stores/authStore.js';
import { Comment } from '../../types/index.js';
import { Avatar } from '../ui/avatar.js';
import { Button } from '../ui/button.js';
import { formatRelativeTime } from '../../lib/utils.js';
import { Send, CornerDownRight, Trash2 } from 'lucide-react';

interface CommentSectionProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  onCommentCountChange,
}) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyingToUser, setReplyingToUser] = useState<string | null>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const res = await api.get(`/posts/${postId}/comments`);
      return (res.data?.data || []) as Comment[];
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string | null }) => {
      const res = await api.post(`/posts/${postId}/comments`, {
        content,
        parent_comment_id: parentId || null,
      });
      return res.data?.data;
    },
    onSuccess: (newComment) => {
      setCommentText('');
      setReplyToId(null);
      setReplyingToUser(null);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const content = replyingToUser
      ? `@${replyingToUser} ${commentText.trim()}`
      : commentText.trim();

    addCommentMutation.mutate({ content, parentId: replyToId });
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
      {/* Input Box */}
      {user && (
        <form onSubmit={handleSubmit} className="mb-4">
          {replyingToUser && (
            <div className="flex items-center justify-between text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-t-lg">
              <span>Replying to @{replyingToUser}</span>
              <button
                type="button"
                onClick={() => {
                  setReplyToId(null);
                  setReplyingToUser(null);
                }}
                className="hover:underline font-bold"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <Avatar
              src={user.avatar_url}
              fallback={user.display_name}
              size="sm"
            />
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 pl-4 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || addCommentMutation.isPending}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="py-2 text-center text-xs text-slate-400">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="py-3 text-center text-xs text-slate-400">
          No comments yet. Be the first to start the conversation!
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              {/* Main Comment Bubble */}
              <div className="flex items-start gap-2.5 group">
                <Avatar
                  src={comment.user.avatar_url}
                  fallback={comment.user.display_name}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="inline-block rounded-2xl bg-slate-100 dark:bg-slate-800/70 px-3.5 py-2 text-left max-w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {comment.user.display_name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 break-words">
                      {comment.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] font-medium text-slate-500">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyToId(comment.id);
                        setReplyingToUser(comment.user.username);
                      }}
                      className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
                    >
                      <CornerDownRight className="h-3 w-3" /> Reply
                    </button>

                    {user && user.id === comment.user.id && (
                      <button
                        type="button"
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                        className="hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Nested Replies (1 Level Deep) */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 pl-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2 group">
                      <Avatar
                        src={reply.user.avatar_url}
                        fallback={reply.user.display_name}
                        size="xs"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="inline-block rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 px-3 py-1.5 text-left max-w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {reply.user.display_name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatRelativeTime(reply.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 break-words">
                            {reply.content}
                          </p>
                        </div>
                        {user && user.id === reply.user.id && (
                          <div className="mt-0.5 ml-2">
                            <button
                              type="button"
                              onClick={() => deleteCommentMutation.mutate(reply.id)}
                              className="text-[10px] text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
