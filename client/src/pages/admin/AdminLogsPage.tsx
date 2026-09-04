import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  History,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { ModerationLog } from '../../types/index.js';
import { formatRelativeTime, cn } from '../../lib/utils.js';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner.js';
import { Avatar } from '../../components/ui/avatar.js';
import { Button } from '../../components/ui/button.js';

export const AdminLogsPage: React.FC = () => {
  const [actionFilter, setActionFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{
    success: boolean;
    data: {
      logs: ModerationLog[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    };
  }>({
    queryKey: ['admin-logs', actionFilter, page],
    queryFn: async () => {
      const res = await api.get('/admin/logs', {
        params: {
          action: actionFilter,
          page,
          limit: 20,
        },
      });
      return res.data;
    },
  });

  const logs = data?.data?.logs || [];
  const pagination = data?.data?.pagination;

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'BAN_USER':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'TIMEOUT_USER':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'UNBAN_USER':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'DELETE_CONTENT':
        return 'bg-[#B87568]/20 text-[#B87568] border-[#B87568]/40';
      case 'HIDE_CONTENT':
      case 'AUTO_HIDE':
        return 'bg-[#D0A56A]/20 text-[#D0A56A] border-[#D0A56A]/40';
      case 'RESTORE_CONTENT':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'DISMISS_REPORT':
      case 'RESOLVE_REPORT':
        return 'bg-[#496D6B]/20 text-[#71877B] border-[#496D6B]/40';
      default:
        return 'bg-[#2B3940] text-[#A8AAA0] border-[#3A4B4D]';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#202A2D] border border-[#3A4B4D] p-5 rounded-3xl shadow-lg">
        <div>
          <h1 className="text-xl font-bold text-[#D9D0B8] flex items-center gap-2">
            <History className="h-5 w-5 text-[#D0A56A]" />
            <span>Moderation Audit Ledger</span>
          </h1>
          <p className="text-xs text-[#A8AAA0] mt-0.5">
            Immutable chronological record of all administrative and automated enforcement actions.
          </p>
        </div>

        {/* Action Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#7F8B86]" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 rounded-2xl bg-[#171A1C] border border-[#3A4B4D] text-xs font-semibold text-[#D9D0B8] focus:outline-none focus:border-[#D0A56A]"
          >
            <option value="ALL">All Actions</option>
            <option value="BAN_USER">Ban User</option>
            <option value="TIMEOUT_USER">Timeout User</option>
            <option value="UNBAN_USER">Unban User</option>
            <option value="HIDE_CONTENT">Hide Content</option>
            <option value="DELETE_CONTENT">Delete Content</option>
            <option value="RESTORE_CONTENT">Restore Content</option>
            <option value="AUTO_HIDE">Auto Hide (3 Reports)</option>
            <option value="DISMISS_REPORT">Dismiss Report</option>
            <option value="RESOLVE_REPORT">Resolve Report</option>
            <option value="UPDATE_ROLE">Update Role</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <LoadingSpinner size="lg" label="Loading audit logs..." />
        </div>
      ) : logs.length === 0 ? (
        <div className="p-16 rounded-3xl bg-[#202A2D] border border-[#3A4B4D] text-center">
          <p className="text-sm font-bold text-[#D9D0B8]">No audit logs found</p>
          <p className="text-xs text-[#A8AAA0] mt-1">
            Moderation and policy enforcement entries will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-[#202A2D] border border-[#3A4B4D] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#D9D0B8]">
              <thead className="bg-[#171A1C] border-b border-[#3A4B4D] text-[11px] uppercase tracking-wider text-[#A8AAA0]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Actor</th>
                  <th className="py-3.5 px-4 font-semibold">Action</th>
                  <th className="py-3.5 px-4 font-semibold">Target</th>
                  <th className="py-3.5 px-4 font-semibold">Reason / Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3A4B4D]/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#2B3940]/40 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 shrink-0 whitespace-nowrap">
                      <div className="font-medium text-[#D9D0B8]">
                        {new Date(log.created_at).toLocaleDateString()}{' '}
                        <span className="text-[#A8AAA0] text-[11px]">
                          {new Date(log.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#7F8B86]">
                        {formatRelativeTime(log.created_at)}
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.admin ? (
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={log.admin.avatar_url}
                            fallback={log.admin.display_name}
                            size="xs"
                          />
                          <div>
                            <p className="font-bold text-[#D9D0B8] leading-tight">
                              {log.admin.display_name}
                            </p>
                            <p className="text-[10px] text-[#7F8B86]">@{log.admin.username}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D0A56A]">
                          <Shield className="h-3 w-3" />
                          <span>System (Auto-Hide Engine)</span>
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full font-mono font-bold text-[10px] border',
                          getActionBadge(log.action)
                        )}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-[#D9D0B8]">{log.target_type}</span>{' '}
                      <span className="font-mono text-[10px] text-[#7F8B86]">
                        ({log.target_id.slice(0, 8)}...)
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-sm truncate text-[#A8AAA0]">
                      {log.reason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#202A2D] border border-[#3A4B4D]">
          <span className="text-xs text-[#A8AAA0]">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total log entries)
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
    </div>
  );
};
