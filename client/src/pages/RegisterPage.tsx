import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/auth/RegisterForm.js';
import { Users, Star, Globe } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Real connections',
    desc: 'Follow people you actually know, not influencers picked by an algorithm.',
  },
  {
    icon: Star,
    title: 'Ad-free experience',
    desc: 'No sponsored posts, no promoted content, no ads. Ever.',
  },
  {
    icon: Globe,
    title: 'Private by default',
    desc: 'You control what you share and who sees it.',
  },
];

export const RegisterPage: React.FC = () => {
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
          <circle cx="55%" cy="48%" r="360" fill="none" stroke="#818cf8" strokeWidth="1" />
          <circle cx="55%" cy="48%" r="260" fill="none" stroke="#818cf8" strokeWidth="0.8" />
          <circle cx="55%" cy="48%" r="165" fill="none" stroke="#a78bfa" strokeWidth="0.6" />
          <circle cx="55%" cy="48%" r="80"  fill="none" stroke="#c4b5fd" strokeWidth="0.5" />
          <circle cx="55%" cy="12.5%" r="5" fill="#818cf8" />
          <circle cx="81%" cy="48%" r="4.5" fill="#a78bfa" />
          <circle cx="55%" cy="71%" r="4" fill="#818cf8" />
          <circle cx="39%" cy="48%" r="3.5" fill="#c4b5fd" />
          <line x1="55%" y1="48%" x2="55%" y2="12.5%" stroke="#818cf8" strokeWidth="0.4" strokeDasharray="4 8" />
          <line x1="55%" y1="48%" x2="81%" y2="48%" stroke="#818cf8" strokeWidth="0.4" strokeDasharray="4 8" />
          <line x1="55%" y1="48%" x2="55%" y2="71%" stroke="#818cf8" strokeWidth="0.4" strokeDasharray="4 8" />
          <line x1="55%" y1="48%" x2="39%" y2="48%" stroke="#818cf8" strokeWidth="0.4" strokeDasharray="4 8" />
          <circle cx="12%" cy="18%" r="1.5" fill="#e2e8f0" />
          <circle cx="82%" cy="10%" r="1"   fill="#e2e8f0" />
          <circle cx="22%" cy="78%" r="1.5" fill="#c4b5fd" />
          <circle cx="78%" cy="82%" r="1"   fill="#818cf8" />
          <circle cx="8%"  cy="62%" r="1"   fill="#e2e8f0" />
          <circle cx="90%" cy="40%" r="1.5" fill="#a78bfa" />
          <circle cx="30%" cy="28%" r="1"   fill="#e2e8f0" />
          <circle cx="72%" cy="90%" r="1"   fill="#c4b5fd" />
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
            Join the orbit.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              On your terms.
            </span>
          </p>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-xs">
            Create a free account in seconds and connect with the people who matter without sacrificing your privacy.
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
        <p className="relative z-10 text-xs text-slate-700">Orbit: built for privacy.</p>
      </div>

      {/* ── Right Form Panel ───────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900">
        {/* Top-right login link */}
        <div className="flex justify-end p-4 sm:p-6">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Already have an account?{' '}
            <span className="font-bold text-indigo-600 dark:text-indigo-400">Log in →</span>
          </button>
        </div>

        {/* Centered form */}
        <div className="flex flex-1 items-center justify-center px-4 pb-12">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};
