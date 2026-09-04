import React from 'react';
import { ShieldAlert, Clock, AlertTriangle, LogOut, Mail } from 'lucide-react';
import { useAuthStore } from '../stores/authStore.js';
import { Button } from '../components/ui/button.js';
import { formatRelativeTime } from '../lib/utils.js';

export const BannedPage: React.FC = () => {
  const { user, logout } = useAuthStore();

  const isTemporary =
    user?.banned_until && new Date(user.banned_until).getTime() > Date.now();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#141819] select-none text-[#D9D0B8]">
      <div className="w-full max-w-lg rounded-3xl bg-[#202A2D] border border-[#3A4B4D] p-8 shadow-2xl text-center animate-slide-up">
        {/* Warning Icon Badge */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#B87568]/20 border border-[#B87568]/40 text-[#B87568] mb-6 shadow-inner">
          <ShieldAlert className="h-8 w-8" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[#D9D0B8] mb-2 tracking-tight">
          {isTemporary ? 'Account Temporarily Suspended' : 'Account Suspended'}
        </h1>
        <p className="text-sm text-[#A8AAA0] mb-6 leading-relaxed">
          Your account (@{user?.username || 'user'}) has been restricted due to violations of our
          Community Guidelines and Trust & Safety policies.
        </p>

        {/* Infraction Card */}
        <div className="rounded-2xl bg-[#171A1C] border border-[#3A4B4D] p-5 text-left mb-6 space-y-3.5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#B87568]/10 text-[#B87568] shrink-0 mt-0.5">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#A8AAA0] uppercase tracking-wider">
                Reason for Enforcement
              </p>
              <p className="text-sm text-[#D9D0B8] font-medium mt-0.5 break-words">
                {user?.ban_reason || 'Violation of Orbit community safety guidelines'}
              </p>
            </div>
          </div>

          {isTemporary && user?.banned_until && (
            <div className="flex items-start gap-3 pt-2 border-t border-[#3A4B4D]/60">
              <div className="p-2 rounded-xl bg-[#D0A56A]/10 text-[#D0A56A] shrink-0 mt-0.5">
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#A8AAA0] uppercase tracking-wider">
                  Timeout Duration
                </p>
                <p className="text-sm text-[#D0A56A] font-semibold mt-0.5">
                  Expires {new Date(user.banned_until).toLocaleString()} (
                  {formatRelativeTime(user.banned_until)})
                </p>
              </div>
            </div>
          )}

          {(user?.strike_count ?? 0) > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-[#3A4B4D]/60 text-xs">
              <span className="text-[#A8AAA0]">Total Safety Strikes</span>
              <span className="px-2 py-0.5 rounded-full font-bold bg-[#B87568]/20 text-[#B87568] border border-[#B87568]/40">
                {user?.strike_count} {user?.strike_count === 1 ? 'strike' : 'strikes'}
              </span>
            </div>
          )}
        </div>

        {/* Appeal Information */}
        <div className="rounded-2xl bg-[#2B3940]/40 border border-[#3A4B4D]/60 p-4 text-xs text-[#A8AAA0] leading-relaxed mb-6">
          <div className="flex items-center justify-center gap-1.5 text-[#D9D0B8] font-semibold mb-1">
            <Mail className="h-3.5 w-3.5 text-[#D0A56A]" />
            <span>Need to Appeal?</span>
          </div>
          If you believe this action was made in error or have questions regarding your account
          status, you can reach out to our team at{' '}
          <a
            href="mailto:safety@orbit.local"
            className="text-[#D0A56A] underline hover:text-[#E0B779]"
          >
            safety@orbit.local
          </a>{' '}
          referencing your username.
        </div>

        {/* Logout Action */}
        <Button
          onClick={logout}
          variant="outline"
          className="w-full border-[#3A4B4D] hover:bg-[#2B3940] text-[#D9D0B8] gap-2 rounded-xl h-11 font-semibold"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out of Orbit</span>
        </Button>
      </div>
    </div>
  );
};
