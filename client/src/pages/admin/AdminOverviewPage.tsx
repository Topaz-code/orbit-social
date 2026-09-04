import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import {
  Inbox,
  EyeOff,
  UserX,
  Activity,
  ArrowRight,
  ShieldAlert,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { AdminMetrics } from '../../types/index.js';
import { formatRelativeTime } from '../../lib/utils.js';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner.js';

export const AdminOverviewPage: React.FC = () => {
  const { data, isLoading, error } = useQuery<{ success: boolean; data: AdminMetrics }>({
    queryKey: ['admin-metrics'],
    queryFn: async () => {
      const res = await api.get('/admin/metrics');
      return res.data;
    },
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[40vh]">
        <LoadingSpinner size="md" label="Loading security metrics..." />
      </div>
    );
  }

  const metrics = data?.data;

  const statCards = [
    {
      title: 'Pending Reports',
      count: metrics?.pendingReportsCount ?? 0,
      description: 'Reports awaiting staff investigation',
      icon: Inbox,
      color: 'text-[#D0A56A]',
      bgColor: 'bg-[#D0A56A]/10 border-[#D0A56A]/30',
      link: '/admin/reports?status=PENDING',
    },
    {
      title: 'Auto-Hidden Posts',
      count: metrics?.hiddenPostsCount ?? 0,
      description: 'Posts hidden due to ≥3 reports or flags',
      icon: EyeOff,
      color: 'text-[#B87568]',
      bgColor: 'bg-[#B87568]/10 border-[#B87568]/30',
      link: '/admin/reports?reported_type=POST',
    },
    {
      title: 'Suspended Users',
      count: metrics?.bannedUsersCount ?? 0,
      description: 'Accounts with active bans or timeouts',
      icon: UserX,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/30',
      link: '/admin/users?status=BANNED',
    },
    {
      title: 'Moderator Actions Today',
      count: metrics?.actionsTodayCount ?? 0,
      description: 'Enforcement decisions in last 24h',
      icon: Activity,
      color: 'text-[#71877B]',
      bgColor: 'bg-[#496D6B]/10 border-[#496D6B]/30',
      link: '/admin/logs',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <NavLink
              key={card.title}
              to={card.link}
              className="rounded-3xl bg-[#202A2D] border border-[#3A4B4D] p-5 shadow-lg hover:border-[#D0A56A]/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-[#A8AAA0] uppercase tracking-wider">
                    {card.title}
                  </span>
                  <div className={`p-2.5 rounded-2xl border ${card.bgColor} ${card.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-[#D9D0B8] mb-1">
                  {card.count.toLocaleString()}
                </div>
                <p className="text-xs text-[#A8AAA0]">{card.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#3A4B4D]/60 flex items-center justify-between text-xs font-semibold text-[#A8AAA0] group-hover:text-[#D0A56A] transition-colors">
                <span>View Details</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* Safety Policy & Quick Action Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Action Guides */}
        <div className="lg:col-span-1 rounded-3xl bg-[#202A2D] border border-[#3A4B4D] p-6 space-y-4">
          <h2 className="text-base font-bold text-[#D9D0B8] flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[#D0A56A]" />
            <span>Automated Policies</span>
          </h2>
          <div className="space-y-3 text-xs text-[#A8AAA0] leading-relaxed">
            <div className="p-3 rounded-2xl bg-[#171A1C] border border-[#3A4B4D]">
              <p className="font-semibold text-[#D9D0B8] mb-1">Auto-Hide Engine</p>
              <span>
                Any post, comment, or story that accumulates <strong className="text-[#D0A56A]">3 or more unique reports</strong> is automatically hidden across all feeds until reviewed by staff.
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#171A1C] border border-[#3A4B4D]">
              <p className="font-semibold text-[#D9D0B8] mb-1">Content Scanner</p>
              <span>
                All new posts, comments, stories, and direct messages undergo instant keyword and malicious link inspection to block scam bots and harmful links.
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#171A1C] border border-[#3A4B4D]">
              <p className="font-semibold text-[#D9D0B8] mb-1">Immediate Ban Enforcement</p>
              <span>
                Active bans and timeouts are evaluated synchronously in middleware, terminating user sessions instantly without waiting for token refresh.
              </span>
            </div>
          </div>
        </div>

        {/* Recent Audit Log Stream */}
        <div className="lg:col-span-2 rounded-3xl bg-[#202A2D] border border-[#3A4B4D] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#D9D0B8] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#496D6B]" />
                <span>Recent Safety Audit Log</span>
              </h2>
              <NavLink
                to="/admin/logs"
                className="text-xs font-semibold text-[#D0A56A] hover:underline flex items-center gap-1"
              >
                <span>View Full Log</span>
                <ExternalLink className="h-3 w-3" />
              </NavLink>
            </div>

            {(!metrics?.recentLogs || metrics.recentLogs.length === 0) ? (
              <div className="py-8 text-center text-xs text-[#7F8B86]">
                No moderation actions logged yet today.
              </div>
            ) : (
              <div className="space-y-2.5">
                {metrics.recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-[#171A1C] border border-[#3A4B4D]/60 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[10px] bg-[#2B3940] text-[#D0A56A] border border-[#3A4B4D]">
                        {log.action}
                      </span>
                      <span className="text-[#A8AAA0] truncate">
                        Target: <strong className="text-[#D9D0B8]">{log.target_type}</strong> ({log.target_id.slice(0, 8)}...)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-[#7F8B86]">
                      <span>by @{log.admin?.username || 'system'}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(log.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#3A4B4D]/60 flex items-center justify-between text-xs text-[#A8AAA0]">
            <span>System status: Operational</span>
            <span className="text-[#71877B] font-semibold">Live Real-time Protection</span>
          </div>
        </div>
      </div>
    </div>
  );
};
