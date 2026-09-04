import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { useAuthStore } from '../../stores/authStore.js';
import { Comment } from '../../types/index.js';
import { Avatar } from '../ui/avatar.js';
import { Button } from '../ui/button.js';
import { formatRelativeTime } from '../../lib/utils.js';
import { Send, CornerDownRight, Trash2, Flag } from 'lucide-react';
import { ReportDialog } from '../shared/ReportDialog.js';

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
  const [reportingComment, setReportingComment] = useState<{ id: string; username: string } | null>(null);

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
    <div className="mt-4 pt-4 border-t border-[#3A4B4D] animate-fade-in">
      {/* Input Box */}
      {user && (
        <form onSubmit={handleSubmit} className="mb-4">
          {replyingToUser && (
            <div className="flex items-center justify-between text-[11px] text-[#D0A56A] bg-[#2B3940] border border-b-0 border-[#3A4B4D] px-3 py-1 rounded-t-[10px]">
              <span>Replying to @{replyingToUser}</span>
              <button
                type="button"
                onClick={() => {
                  setReplyToId(null);
                  setReplyingToUser(null);
                }}
                className="hover:underline font-bold text-[#A8AAA0]"
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
                className="w-full h-10 rounded-[10px] border border-[#3A4B4D] bg-[#2B3940] pl-4 pr-10 text-sm text-[#D9D0B8] placeholder:text-[#7F8B86] focus:outline-none focus:ring-2 focus:ring-[#496D6B]"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || addCommentMutation.isPending}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#D0A56A] text-[#171A1C] disabled:opacity-40 hover:bg-[#E0B779] transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="py-2 text-center text-xs text-[#7F8B86]">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="py-3 text-center text-xs text-[#7F8B86]">
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
                  <div className="inline-block rounded-2xl bg-[#2B3940] border border-[#3A4B4D] px-3.5 py-2 text-left max-w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#D9D0B8]">
                        {comment.user.display_name}
                      </span>
                      <span className="text-[10px] text-[#A8AAA0]">
                        {formatRelativeTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-[#D9D0B8] mt-0.5 break-words">
                      {comment.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] font-medium text-[#A8AAA0]">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyToId(comment.id);
                        setReplyingToUser(comment.user.username);
                      }}
                      className="hover:text-[#D0A56A] flex items-center gap-1 transition-colors"
                    >
                      <CornerDownRight className="h-3 w-3" /> Reply
                    </button>

                    {user && user.id === comment.user.id && (
                      <button
                        type="button"
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                        className="hover:text-[#B87568] opacity-0 group-hover:opacity-100 transition-opacity text-[#7F8B86]"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}

                    {user && user.id !== comment.user.id && (
                      <button
                        type="button"
                        onClick={() =>
                          setReportingComment({ id: comment.id, username: comment.user.username })
                        }
                        className="hover:text-[#B87568] opacity-0 group-hover:opacity-100 transition-opacity text-[#7F8B86]"
                        title="Report comment"
                      >
                        <Flag className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Nested Replies (1 Level Deep) */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 space-y-2 border-l-2 border-[#3A4B4D] pl-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2 group">
                      <Avatar
                        src={reply.user.avatar_url}
                        fallback={reply.user.display_name}
                        size="xs"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="inline-block rounded-2xl bg-[#2B3940]/70 border border-[#3A4B4D] px-3 py-1.5 text-left max-w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#D9D0B8]">
                              {reply.user.display_name}
                            </span>
                            <span className="text-[10px] text-[#A8AAA0]">
                              {formatRelativeTime(reply.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-[#D9D0B8] mt-0.5 break-words">
                            {reply.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 ml-2">
                          {user && user.id === reply.user.id && (
                            <button
                              type="button"
                              onClick={() => deleteCommentMutation.mutate(reply.id)}
                              className="text-[10px] text-[#7F8B86] hover:text-[#B87568] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Delete
                            </button>
                          )}
                          {user && user.id !== reply.user.id && (
                            <button
                              type="button"
                              onClick={() =>
                                setReportingComment({ id: reply.id, username: reply.user.username })
                              }
                              className="text-[10px] text-[#7F8B86] hover:text-[#B87568] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                              title="Report reply"
                            >
                              <Flag className="h-2.5 w-2.5" /> Report
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Report Comment Dialog */}
      {reportingComment && (
        <ReportDialog
          isOpen={!!reportingComment}
          onClose={() => setReportingComment(null)}
          reportedType="COMMENT"
          reportedId={reportingComment.id}
          targetTitle={`Report comment by @${reportingComment.username}`}
        />
      )}
    </div>
  );
};
