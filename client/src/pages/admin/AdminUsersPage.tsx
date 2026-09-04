import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { User } from '../../types/index.js';
import { formatRelativeTime, cn } from '../../lib/utils.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useDialogStore } from '../../stores/dialogStore.js';
import { Button } from '../../components/ui/button.js';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner.js';
import { Avatar } from '../../components/ui/avatar.js';

export const AdminUsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const { toast, openConfirm } = useDialogStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // Timeout Modal state
  const [timeoutModal, setTimeoutModal] = useState<{
    userId: string;
    username: string;
  } | null>(null);
  const [timeoutDuration, setTimeoutDuration] = useState<number>(24);
  const [timeoutReason, setTimeoutReason] = useState<string>('Community guideline violation');

  const { data, isLoading } = useQuery<{
    success: boolean;
    data: {
      users: User[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    };
  }>({
    queryKey: ['admin-users', searchQuery, roleFilter, statusFilter, page],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: {
          search: searchQuery || undefined,
          role: roleFilter,
          status: statusFilter,
          page,
          limit: 15,
        },
      });
      return res.data;
    },
  });

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination;

  // Mutation: Ban / Unban User
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
      reason?: string;
    }) => {
      const res = await api.patch(`/admin/users/${userId}/ban`, {
        is_banned: isBanned,
        banned_until: bannedUntil,
        ban_reason: reason,
      });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'User status updated.');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      setTimeoutModal(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update user ban status.');
    },
  });

  // Mutation: Update Role (Admin only)
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await api.patch(`/admin/users/${userId}/role`, { role });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'User role updated.');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update user role.');
    },
  });

  const handleUnban = (userId: string, username: string) => {
    openConfirm({
      title: `Unban @${username}?`,
      message: 'This will restore full access to their account and clear active timeouts.',
      confirmText: 'Unban User',
      variant: 'primary',
      onConfirm: async () => {
        await banUserMutation.mutateAsync({
          userId,
          isBanned: false,
          bannedUntil: null,
          reason: 'Access restored by administrator',
        });
      },
    });
  };

  const handlePermanentBan = (userId: string, username: string) => {
    openConfirm({
      title: `Permanently Ban @${username}?`,
      message:
        'This will immediately revoke their access and terminate all active sessions.',
      confirmText: 'Ban User',
      variant: 'danger',
      onConfirm: async () => {
        await banUserMutation.mutateAsync({
          userId,
          isBanned: true,
          bannedUntil: null,
          reason: 'Permanent administrative suspension',
        });
      },
    });
  };

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

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#202A2D] border border-[#3A4B4D] p-5 rounded-3xl shadow-lg">
        <div>
          <h1 className="text-xl font-bold text-[#D9D0B8] flex items-center gap-2">
            <Users className="h-5 w-5 text-[#D0A56A]" />
            <span>User Directory & Moderation</span>
          </h1>
          <p className="text-xs text-[#A8AAA0] mt-0.5">
            Search accounts, manage strikes, switch permissions, and enact suspensions.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7F8B86]" />
            <input
              type="text"
              placeholder="Search username, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 pl-9 pr-3 rounded-2xl bg-[#171A1C] border border-[#3A4B4D] text-xs text-[#D9D0B8] placeholder:text-[#7F8B86] focus:outline-none focus:border-[#D0A56A]"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 rounded-2xl bg-[#171A1C] border border-[#3A4B4D] text-xs font-semibold text-[#D9D0B8] focus:outline-none focus:border-[#D0A56A]"
          >
            <option value="ALL">All Roles</option>
            <option value="USER">User</option>
            <option value="MODERATOR">Moderator</option>
            <option value="ADMIN">Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 rounded-2xl bg-[#171A1C] border border-[#3A4B4D] text-xs font-semibold text-[#D9D0B8] focus:outline-none focus:border-[#D0A56A]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="BANNED">Suspended / Timed Out</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <LoadingSpinner size="lg" label="Loading user directory..." />
        </div>
      ) : users.length === 0 ? (
        <div className="p-16 rounded-3xl bg-[#202A2D] border border-[#3A4B4D] text-center">
          <p className="text-sm font-bold text-[#D9D0B8]">No users found</p>
          <p className="text-xs text-[#A8AAA0] mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-[#202A2D] border border-[#3A4B4D] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#D9D0B8]">
              <thead className="bg-[#171A1C] border-b border-[#3A4B4D] text-[11px] uppercase tracking-wider text-[#A8AAA0]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">User</th>
                  <th className="py-3.5 px-4 font-semibold">Role</th>
                  <th className="py-3.5 px-4 font-semibold">Safety Status</th>
                  <th className="py-3.5 px-4 font-semibold">Strikes</th>
                  <th className="py-3.5 px-4 font-semibold">Joined</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3A4B4D]/60">
                {users.map((u) => {
                  const isUserBanned =
                    u.is_banned ||
                    (u.banned_until && new Date(u.banned_until).getTime() > Date.now());
                  const isSelf = currentUser?.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-[#2B3940]/40 transition-colors">
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={u.avatar_url}
                            fallback={u.display_name}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-[#D9D0B8] truncate">
                              {u.display_name}
                            </p>
                            <p className="text-[#A8AAA0] truncate">@{u.username}</p>
                            <p className="text-[10px] text-[#7F8B86] truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Switcher */}
                      <td className="py-3.5 px-4">
                        {isAdmin && !isSelf ? (
                          <select
                            value={u.role || 'USER'}
                            onChange={(e) =>
                              updateRoleMutation.mutate({ userId: u.id, role: e.target.value })
                            }
                            className={cn(
                              'px-2 py-1 rounded-xl text-xs font-semibold bg-[#171A1C] border focus:outline-none cursor-pointer',
                              u.role === 'ADMIN'
                                ? 'text-[#D0A56A] border-[#D0A56A]/40'
                                : u.role === 'MODERATOR'
                                ? 'text-[#71877B] border-[#496D6B]/40'
                                : 'text-[#A8AAA0] border-[#3A4B4D]'
                            )}
                          >
                            <option value="USER">USER</option>
                            <option value="MODERATOR">MODERATOR</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        ) : (
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded-full font-bold text-[11px] border',
                              u.role === 'ADMIN'
                                ? 'bg-[#D0A56A]/20 text-[#D0A56A] border-[#D0A56A]/40'
                                : u.role === 'MODERATOR'
                                ? 'bg-[#496D6B]/20 text-[#71877B] border-[#496D6B]/40'
                                : 'bg-[#2B3940] text-[#A8AAA0] border-[#3A4B4D]'
                            )}
                          >
                            {u.role || 'USER'}
                          </span>
                        )}
                      </td>

                      {/* Safety Status */}
                      <td className="py-3.5 px-4">
                        {u.is_banned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <Ban className="h-3 w-3" />
                            <span>Banned</span>
                          </span>
                        ) : u.banned_until && new Date(u.banned_until).getTime() > Date.now() ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            title={`Expires ${new Date(u.banned_until).toLocaleString()}`}
                          >
                            <Clock className="h-3 w-3" />
                            <span>Timed Out</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>

                      {/* Strikes */}
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full font-bold text-xs border',
                            (u.strike_count ?? 0) > 0
                              ? 'bg-[#B87568]/20 text-[#B87568] border-[#B87568]/40'
                              : 'bg-[#2B3940] text-[#7F8B86] border-[#3A4B4D]'
                          )}
                        >
                          {u.strike_count ?? 0}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-[#7F8B86]">
                        {formatRelativeTime(u.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {!isSelf && (
                          <div className="flex items-center justify-end gap-2">
                            {isUserBanned ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnban(u.id, u.username)}
                                className="border-[#3A4B4D] hover:bg-[#2B3940] text-emerald-400 gap-1 rounded-xl text-xs"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Unban</span>
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setTimeoutModal({ userId: u.id, username: u.username })
                                  }
                                  className="border-[#3A4B4D] hover:bg-[#2B3940] text-[#D0A56A] gap-1 rounded-xl text-xs"
                                >
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>Timeout</span>
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePermanentBan(u.id, u.username)}
                                  className="border-[#3A4B4D] hover:bg-[#2B3940] text-rose-400 gap-1 rounded-xl text-xs"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                  <span>Ban</span>
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#202A2D] border border-[#3A4B4D]">
          <span className="text-xs text-[#A8AAA0]">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total users)
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
