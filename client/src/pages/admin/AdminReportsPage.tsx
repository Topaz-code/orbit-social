import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Inbox,
  Filter,
  CheckCircle2,
  XCircle,
  EyeOff,
  Trash2,
  Clock,
  Ban,
  RotateCcw,
  AlertTriangle,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Report } from '../../types/index.js';
import { formatRelativeTime, cn } from '../../lib/utils.js';
import { useDialogStore } from '../../stores/dialogStore.js';
import { Button } from '../../components/ui/button.js';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner.js';
import { Avatar } from '../../components/ui/avatar.js';

export const AdminReportsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast, openConfirm } = useDialogStore();

  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);

  // Timeout Modal state
  const [timeoutModal, setTimeoutModal] = useState<{
    userId: string;
    username: string;
    reportId: string;
  } | null>(null);
  const [timeoutDuration, setTimeoutDuration] = useState<number>(24); // hours
  const [timeoutReason, setTimeoutReason] = useState<string>('Community guideline violations');

  // Query reports
  const { data, isLoading, isFetching } = useQuery<{
    success: boolean;
    data: {
      reports: Report[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    };
  }>({
    queryKey: ['admin-reports', statusFilter, typeFilter, page],
    queryFn: async () => {
      const res = await api.get('/reports', {
        params: {
          status: statusFilter,
          reported_type: typeFilter,
          page,
          limit: 10,
        },
      });
      return res.data;
    },
  });

  const reports = data?.data?.reports || [];
  const pagination = data?.data?.pagination;

  // Mutation: Update Report Status (Dismiss, Resolve)
  const updateReportMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'RESOLVED' | 'DISMISSED' }) => {
      const res = await api.patch(`/reports/${id}`, { status });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Report updated.');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update report.');
    },
  });

  // Mutation: Content Action (Hide, Delete, Restore)
  const contentActionMutation = useMutation({
    mutationFn: async ({
      type,
      id,
      action,
      reportId,
    }: {
      type: string;
      id: string;
      action: 'HIDE_CONTENT' | 'DELETE_CONTENT' | 'RESTORE_CONTENT';
      reportId?: string;
    }) => {
      const res = await api.post(`/admin/content/${type}/${id}/action`, {
        action,
        reason: `Action taken via report moderation`,
      });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Content action applied successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to execute content action.');
    },
  });

  // Mutation: Ban User
  const banUserMutation = useMutation({
    mutationFn: async ({
      userId,
      isBanned,
      bannedUntil,
      reason,
    }: {
      userId: string;
      isBanned: boolean;
      bannedUntil?: string | null;
      reason: string;
    }) => {
      const res = await api.patch(`/admin/users/${userId}/ban`, {
        is_banned: isBanned,
        banned_until: bannedUntil,
        ban_reason: reason,
      });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'User enforcement applied.');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setTimeoutModal(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to execute user enforcement.');
    },
  });

  const handleApplyTimeout = () => {
    if (!timeoutModal) return;
    const expiresAt = new Date(Date.now() + timeoutDuration * 60 * 60 * 1000).toISOString();
    banUserMutation.mutate({
      userId: timeoutModal.userId,
      isBanned: false,
      bannedUntil: expiresAt,
      reason: timeoutReason,
    });
  };

  const handlePermanentBan = (userId: string, username: string) => {
    openConfirm({
      title: `Permanently Ban @${username}?`,
      message:
        'This will immediately terminate the user session, revoke access, and reject all subsequent requests.',
      confirmText: 'Ban User',
      variant: 'danger',
      onConfirm: async () => {
        await banUserMutation.mutateAsync({
          userId,
          isBanned: true,
          bannedUntil: null,
          reason: 'Permanent ban for severe violations',
        });
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#202A2D] border border-[#3A4B4D] p-5 rounded-3xl shadow-lg">
        <div>
          <h1 className="text-xl font-bold text-[#D9D0B8] flex items-center gap-2">
            <Inbox className="h-5 w-5 text-[#D0A56A]" />
            <span>Community Report Queue</span>
          </h1>
          <p className="text-xs text-[#A8AAA0] mt-0.5">
            Review reported items, verify violations, and enact content or author penalties.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-[#171A1C] border border-[#3A4B4D] p-1 rounded-2xl">
            {['PENDING', 'RESOLVED', 'DISMISSED', 'ALL'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                  statusFilter === st
                    ? 'bg-[#496D6B] text-[#D9D0B8] shadow-xs'
                    : 'text-[#A8AAA0] hover:text-[#D9D0B8]'
                )}
              >
                {st}
              </button>
            ))}
          </div>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 rounded-2xl bg-[#171A1C] border border-[#3A4B4D] text-xs font-semibold text-[#D9D0B8] focus:outline-none focus:border-[#D0A56A]"
          >
            <option value="ALL">All Types</option>
            <option value="POST">Posts</option>
            <option value="COMMENT">Comments</option>
            <option value="USER">Users</option>
            <option value="STORY">Stories</option>
            <option value="MESSAGE">Messages</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <LoadingSpinner size="lg" label="Loading report queue..." />
        </div>
      ) : reports.length === 0 ? (
        <div className="p-16 rounded-3xl bg-[#202A2D] border border-[#3A4B4D] text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#496D6B]/20 text-[#71877B]">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-[#D9D0B8]">Queue is Clean</h3>
          <p className="text-xs text-[#A8AAA0] max-w-sm mx-auto">
            There are no reports matching the selected filters. Great job keeping Orbit safe!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((rep) => {
            const hasAuthor = !!rep.reported_user;
            const author = rep.reported_user;
            const preview = rep.contentPreview;
            const contentStatus = rep.contentStatus || 'UNKNOWN';

            return (
              <div
                key={rep.id}
                className="rounded-3xl bg-[#202A2D] border border-[#3A4B4D] p-5 sm:p-6 shadow-xl space-y-4"
              >
                {/* Card Header: Type, ID, Reason, Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3A4B4D]/60">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold font-mono bg-[#171A1C] text-[#D0A56A] border border-[#3A4B4D]">
                      {rep.reported_type}
                    </span>

                    <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#B87568]/20 text-[#B87568] border border-[#B87568]/40">
                      Reason: {rep.reason}
                    </span>

                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-xl text-xs font-semibold border',
                        rep.status === 'PENDING'
                          ? 'bg-[#D0A56A]/20 text-[#D0A56A] border-[#D0A56A]/40'
                          : rep.status === 'RESOLVED'
                          ? 'bg-[#496D6B]/20 text-[#71877B] border-[#496D6B]/40'
                          : 'bg-[#2B3940] text-[#A8AAA0] border-[#3A4B4D]'
                      )}
                    >
                      Report {rep.status}
                    </span>

                    {contentStatus && (
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-xl text-xs font-semibold border',
                          contentStatus === 'HIDDEN'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : contentStatus === 'DELETED' || contentStatus === 'REMOVED'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        )}
                      >
                        Content: {contentStatus}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-[#7F8B86]">
                    Reported {formatRelativeTime(rep.created_at)}
                  </div>
                </div>

                {/* Content Preview Box */}
                <div className="rounded-2xl bg-[#171A1C] border border-[#3A4B4D] p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#A8AAA0]">
                    <span className="font-semibold uppercase tracking-wider text-[11px]">
                      Reported Content Preview
                    </span>
                    <span className="font-mono text-[10px] text-[#7F8B86]">ID: {rep.reported_id}</span>
                  </div>

                  {preview ? (
                    <div className="space-y-2">
                      {preview.text && (
                        <p className="text-sm text-[#D9D0B8] leading-relaxed break-words whitespace-pre-wrap font-serif">
                          "{preview.text}"
                        </p>
                      )}
                      {preview.media_url && (
                        <div className="max-w-xs rounded-xl overflow-hidden border border-[#3A4B4D]">
                          {preview.media_type === 'video' ? (
                            <video
                              src={preview.media_url}
                              controls
                              className="w-full max-h-48 object-cover"
                            />
                          ) : (
                            <img
                              src={preview.media_url}
                              alt="Reported attachment"
                              className="w-full max-h-48 object-cover"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs italic text-[#7F8B86]">
                      Target content was deleted or is unavailable.
                    </p>
                  )}

                  {rep.details && (
                    <div className="mt-2 pt-2 border-t border-[#3A4B4D]/60 text-xs text-[#A8AAA0]">
                      <strong className="text-[#D9D0B8]">Reporter context:</strong> {rep.details}
                    </div>
                  )}
                </div>

                {/* Reporter & Author Profiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Reporter Info */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#171A1C]/50 border border-[#3A4B4D]/50">
                    <Avatar
                      src={rep.reporter?.avatar_url}
                      fallback={rep.reporter?.display_name}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#A8AAA0] uppercase tracking-wider font-semibold">
                        Reported By
                      </p>
                      <p className="text-sm font-bold text-[#D9D0B8] truncate">
                        {rep.reporter?.display_name}
                      </p>
                      <p className="text-[11px] text-[#7F8B86] truncate">
                        @{rep.reporter?.username}
                      </p>
                    </div>
                  </div>

                  {/* Author Info */}
                  <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#171A1C]/50 border border-[#3A4B4D]/50">
                    {author ? (
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={author.avatar_url}
                          fallback={author.display_name}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-[#A8AAA0] uppercase tracking-wider font-semibold">
                              Reported Author
                            </span>
                            {author.is_banned && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                                Banned
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-[#D9D0B8] truncate">
                            {author.display_name}
                          </p>
                          <p className="text-[11px] text-[#7F8B86] truncate">@{author.username}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-[#7F8B86]">No author metadata available</div>
                    )}

                    {author && (author.strike_count ?? 0) > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#B87568]/20 text-[#B87568] border border-[#B87568]/40 shrink-0">
                        {author.strike_count} strikes
                      </span>
                    )}
                  </div>
                </div>

                {/* Moderation Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#3A4B4D]">
                  {/* Left: Content Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {['POST', 'COMMENT', 'STORY'].includes(rep.reported_type) && (
                      <>
                        {contentStatus !== 'HIDDEN' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              contentActionMutation.mutate({
                                type: rep.reported_type,
                                id: rep.reported_id,
                                action: 'HIDE_CONTENT',
                                reportId: rep.id,
                              })
                            }
                            className="border-[#3A4B4D] hover:bg-[#2B3940] text-amber-400 gap-1.5 rounded-xl text-xs"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                            <span>Hide Content</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              contentActionMutation.mutate({
                                type: rep.reported_type,
                                id: rep.reported_id,
                                action: 'RESTORE_CONTENT',
                                reportId: rep.id,
                              })
                            }
                            className="border-[#3A4B4D] hover:bg-[#2B3940] text-emerald-400 gap-1.5 rounded-xl text-xs"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Restore Content</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            openConfirm({
                              title: `Delete ${rep.reported_type}?`,
                              message:
                                'This will permanently remove the content item from feeds and database visibility.',
                              confirmText: 'Delete Content',
                              variant: 'danger',
                              onConfirm: async () => {
                                await contentActionMutation.mutateAsync({
                                  type: rep.reported_type,
                                  id: rep.reported_id,
                                  action: 'DELETE_CONTENT',
                                  reportId: rep.id,
                                });
                              },
                            });
                          }}
                          className="bg-[#B87568] hover:bg-[#C98679] text-[#171A1C] gap-1.5 rounded-xl text-xs"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Content</span>
                        </Button>
                      </>
                    )}

                    {author && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setTimeoutModal({
                              userId: author.id,
                              username: author.username,
                              reportId: rep.id,
                            })
                          }
                          className="border-[#3A4B4D] hover:bg-[#2B3940] text-[#D0A56A] gap-1.5 rounded-xl text-xs"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>Timeout User</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePermanentBan(author.id, author.username)}
                          className="border-[#3A4B4D] hover:bg-[#2B3940] text-rose-400 gap-1.5 rounded-xl text-xs"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          <span>Ban User</span>
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Right: Report Resolution Controls */}
                  <div className="flex items-center gap-2">
                    {rep.status !== 'DISMISSED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updateReportMutation.mutate({ id: rep.id, status: 'DISMISSED' })
                        }
                        className="text-[#A8AAA0] hover:text-[#D9D0B8] hover:bg-[#2B3940] rounded-xl text-xs gap-1.5"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Dismiss</span>
                      </Button>
                    )}

                    {rep.status !== 'RESOLVED' && (
                      <Button
                        size="sm"
                        onClick={() =>
                          updateReportMutation.mutate({ id: rep.id, status: 'RESOLVED' })
                        }
                        className="bg-[#496D6B] hover:bg-[#5A7D78] text-[#D9D0B8] rounded-xl text-xs gap-1.5"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Mark Resolved</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#202A2D] border border-[#3A4B4D]">
          <span className="text-xs text-[#A8AAA0]">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total reports)
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-xl border-[#3A4B4D] text-[#A8AAA0]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pagination.pages}
              onClick={() => setPage(page + 1)}
              className="rounded-xl border-[#3A4B4D] text-[#A8AAA0]"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Timeout Modal */}
      {timeoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in select-none">
          <div className="w-full max-w-sm rounded-3xl bg-[#202A2D] border border-[#3A4B4D] p-6 shadow-2xl text-[#D9D0B8] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#D0A56A]/20 border border-[#D0A56A]/40 text-[#D0A56A]">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#D9D0B8]">
                  Timeout @{timeoutModal.username}
                </h3>
                <p className="text-xs text-[#A8AAA0]">Suspend user activity temporarily</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#A8AAA0] mb-1">
                  Timeout Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '24 Hours', hours: 24 },
                    { label: '7 Days', hours: 168 },
                    { label: '30 Days', hours: 720 },
                  ].map((opt) => (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => setTimeoutDuration(opt.hours)}
                      className={cn(
                        'py-2 rounded-xl text-xs font-semibold border transition-all',
                        timeoutDuration === opt.hours
                          ? 'bg-[#D0A56A]/20 border-[#D0A56A] text-[#D0A56A]'
                          : 'bg-[#171A1C] border-[#3A4B4D] text-[#A8AAA0] hover:text-[#D9D0B8]'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8AAA0] mb-1">
                  Reason for Timeout
                </label>
                <input
                  type="text"
                  value={timeoutReason}
                  onChange={(e) => setTimeoutReason(e.target.value)}
                  placeholder="Violating community standards"
                  className="w-full h-9 rounded-xl bg-[#171A1C] border border-[#3A4B4D] px-3 text-xs text-[#D9D0B8] focus:outline-none focus:border-[#D0A56A]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3A4B4D]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTimeoutModal(null)}
                className="text-[#A8AAA0] hover:text-[#D9D0B8] rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApplyTimeout}
                disabled={banUserMutation.isPending}
                isLoading={banUserMutation.isPending}
                className="bg-[#D0A56A] hover:bg-[#E0B779] text-[#171A1C] rounded-xl text-xs font-semibold"
              >
                Apply Timeout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
