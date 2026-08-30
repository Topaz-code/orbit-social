import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm.js';
import { Shield, Zap, Lock } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'No algorithms',
    desc: 'Your feed is yours — chronological, unmanipulated.',
  },
  {
    icon: Lock,
    title: 'End-to-end encrypted',
    desc: 'Messages only you and your contacts can read.',
  },
  {
    icon: Zap,
    title: 'Your data stays yours',
    desc: 'No tracking, no profiling, no selling your attention.',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] flex">
      {/* ── Left Brand Panel (lg+) ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 flex-col justify-between p-12 relative overflow-hidden">
        {/* Abstract orbit / constellation SVG */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none select-none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="60%" cy="50%" r="340" fill="none" stroke="#818cf8" strokeWidth="1" />
          <circle cx="60%" cy="50%" r="240" fill="none" stroke="#818cf8" strokeWidth="0.8" />
          <circle cx="60%" cy="50%" r="150" fill="none" stroke="#a78bfa" strokeWidth="0.6" />
          <circle cx="60%" cy="50%" r="75"  fill="none" stroke="#c4b5fd" strokeWidth="0.5" />
          <circle cx="60%" cy="16%" r="5" fill="#818cf8" />
          <circle cx="84%" cy="50%" r="4.5" fill="#a78bfa" />
          <circle cx="60%" cy="75%" r="4" fill="#818cf8" />
          <circle cx="42.5%" cy="50%" r="3.5" fill="#c4b5fd" />
          <line x1="60%" y1="50%" x2="60%" y2="16%" stroke="#818cf8" strokeWidth="0.4" strokeDasharray="4 8" />
          <line x1="60%" y1="50%" x2="84%" y2="50%" stroke="#818cf8" strokeWidth="0.4" strokeDasharray="4 8" />
          <line x1="60%" y1="50%" x2="60%" y2="75%" stroke="#818cf8" strokeWidth="0.4" strokeDasharray="4 8" />
          <line x1="60%" y1="50%" x2="42.5%" y2="50%" stroke="#818cf8" strokeWidth="0.4" strokeDasharray="4 8" />
          <circle cx="15%" cy="20%" r="1.5" fill="#e2e8f0" />
          <circle cx="80%" cy="12%" r="1"   fill="#e2e8f0" />
          <circle cx="25%" cy="75%" r="1.5" fill="#c4b5fd" />
          <circle cx="75%" cy="80%" r="1"   fill="#818cf8" />
          <circle cx="10%" cy="60%" r="1"   fill="#e2e8f0" />
          <circle cx="88%" cy="42%" r="1.5" fill="#a78bfa" />
          <circle cx="35%" cy="30%" r="1"   fill="#e2e8f0" />
          <circle cx="70%" cy="88%" r="1"   fill="#c4b5fd" />
        </svg>

        {/* Logo + wordmark */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600/20 p-2 ring-1 ring-indigo-500/30">
              <img src="/orbit-logo.svg" alt="Orbit" className="h-full w-full" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">Orbit</span>
          </div>

          <p className="mt-6 text-4xl font-black leading-tight text-white">
            Your circle.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Your rules.
            </span>
          </p>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-xs">
            A social platform that respects you — no dark patterns, no engagement traps, just the people you care about.
          </p>
        </div>

        {/* Feature bullets */}
        <div className="relative z-10 space-y-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600/15 ring-1 ring-indigo-500/25">
                <Icon className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">{title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer tagline */}
        <p className="relative z-10 text-xs text-slate-700">Orbit — built for privacy.</p>
      </div>

      {/* ── Right Form Panel ───────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900">
        {/* Top-right register link */}
        <div className="flex justify-end p-4 sm:p-6">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            New to Orbit?{' '}
            <span className="font-bold text-indigo-600 dark:text-indigo-400">Create account →</span>
          </button>
        </div>

        {/* Centered form */}
        <div className="flex flex-1 items-center justify-center px-4 pb-12">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};
