import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm.js';
import { Shield, Zap, Lock } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'No algorithms',
    desc: 'Your feed is chronological and unmanipulated.',
  },
  {
    icon: Lock,
    title: 'Encrypted in transit',
    desc: 'HTTPS and secure WebSockets with zero ad-tracking.',
  },
  {
    icon: Zap,
    title: 'Your data stays yours',
    desc: 'Never sold, analyzed, or shared with third parties.',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] lg:h-screen lg:overflow-hidden flex bg-[#171A1C] text-[#D9D0B8]">
      {/* ── Left Brand Panel (lg+) ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 lg:h-full bg-[#141819] border-r border-[#3A4B4D] flex-col justify-between p-12 relative overflow-hidden select-none shrink-0">
        {/* Abstract orbit / constellation SVG */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none select-none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="60%" cy="50%" r="340" fill="none" stroke="#D0A56A" strokeWidth="1" />
          <circle cx="60%" cy="50%" r="240" fill="none" stroke="#496D6B" strokeWidth="0.8" />
          <circle cx="60%" cy="50%" r="150" fill="none" stroke="#71877B" strokeWidth="0.6" />
          <circle cx="60%" cy="50%" r="75"  fill="none" stroke="#D0A56A" strokeWidth="0.5" />
          <circle cx="60%" cy="16%" r="5" fill="#D0A56A" />
          <circle cx="84%" cy="50%" r="4.5" fill="#496D6B" />
          <circle cx="60%" cy="75%" r="4" fill="#71877B" />
          <circle cx="42.5%" cy="50%" r="3.5" fill="#D0A56A" />
          <line x1="60%" y1="50%" x2="60%" y2="16%" stroke="#496D6B" strokeWidth="0.4" strokeDasharray="4 8" />
          <line x1="60%" y1="50%" x2="84%" y2="50%" stroke="#496D6B" strokeWidth="0.4" strokeDasharray="4 8" />
          <line x1="60%" y1="50%" x2="60%" y2="75%" stroke="#496D6B" strokeWidth="0.4" strokeDasharray="4 8" />
          <line x1="60%" y1="50%" x2="42.5%" y2="50%" stroke="#496D6B" strokeWidth="0.4" strokeDasharray="4 8" />
          <circle cx="15%" cy="20%" r="1.5" fill="#D9D0B8" />
          <circle cx="80%" cy="12%" r="1"   fill="#D9D0B8" />
          <circle cx="25%" cy="75%" r="1.5" fill="#D0A56A" />
          <circle cx="75%" cy="80%" r="1"   fill="#71877B" />
          <circle cx="10%" cy="60%" r="1"   fill="#D9D0B8" />
          <circle cx="88%" cy="42%" r="1.5" fill="#496D6B" />
          <circle cx="35%" cy="30%" r="1"   fill="#D9D0B8" />
          <circle cx="70%" cy="88%" r="1"   fill="#D0A56A" />
        </svg>

        {/* Logo + wordmark */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#202A2D] p-2 border border-[#3A4B4D]">
              <img src="/orbit-logo.svg" alt="Orbit" className="h-full w-full" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#D9D0B8]">Orbit</span>
          </div>

          <p className="mt-6 text-4xl font-bold leading-tight text-[#D9D0B8]">
            Your circle.
            <br />
            <span className="text-[#D0A56A]">
              Your rules.
            </span>
          </p>
          <p className="mt-3 text-sm text-[#A8AAA0] leading-relaxed max-w-xs">
            A social platform that respects you: no dark patterns, no engagement traps, just the people you care about.
          </p>
        </div>

        {/* Feature bullets */}
        <div className="relative z-10 space-y-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#202A2D] border border-[#3A4B4D]">
                <Icon className="h-4 w-4 text-[#D0A56A]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#D9D0B8]">{title}</p>
                <p className="text-xs text-[#A8AAA0] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer tagline */}
        <p className="relative z-10 text-xs text-[#7F8B86]">Orbit: built for privacy.</p>
      </div>

      {/* ── Right Form Panel ───────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#171A1C] lg:h-full lg:overflow-y-auto">
        {/* Top-right register link */}
        <div className="flex justify-end p-4 sm:p-6 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-xs font-medium text-[#A8AAA0] hover:text-[#D9D0B8] transition-colors"
          >
            New to Orbit?{' '}
            <span className="font-bold text-[#D0A56A]">Create account →</span>
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
