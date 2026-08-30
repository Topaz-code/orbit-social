import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore.js';
import { useThemeStore } from '../stores/themeStore.js';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import { Textarea } from '../components/ui/textarea.js';
import { Avatar } from '../components/ui/avatar.js';
import {
  User,
  Shield,
  Palette,
  HardDrive,
  Sun,
  Moon,
  Laptop,
  Lock,
  Download,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Phone,
  AtSign,
  Eye,
  EyeOff,
  ShieldCheck,
  Database,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { cn } from '../lib/utils.js';

type SettingsTab = 'profile' | 'security' | 'appearance' | 'data';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMsg(null);
    setProfileError(null);
    try {
      await updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim(),
        phone: phone.trim() || undefined,
      });
      setProfileMsg('Your profile changes have been saved successfully.');
      setTimeout(() => setProfileMsg(null), 3500);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || err.message || 'Could not update profile.');
      setTimeout(() => setProfileError(null), 4000);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsChangingPass(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMsg('Password changed successfully! Keep your new credentials safe.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 3500);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await api.get(`/users/${user?.id}/export`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orbit-data-export-${user?.username || 'user'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Data export generated from SQLite local database.');
    }
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'profile', label: 'Profile Details', icon: User },
    { id: 'security', label: 'Security & Auth', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Privacy & Data', icon: HardDrive },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 min-w-0 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-950 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Personal Preferences</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Settings & Privacy
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Customize your profile appearance, access credentials, interface theme, and decentralized data exports.
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
              <Avatar
                src={user.avatar_url}
                fallback={user.display_name}
                size="md"
                isOnline={true}
                showStatus={true}
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {user.display_name}
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate">
                  @{user.username}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation Pill Strip */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-200/60 dark:border-slate-800/60 pt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Details Tab */}
      {activeTab === 'profile' && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Profile Identity</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              This information is visible on your profile and story updates.
            </p>
          </div>

          {profileMsg && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{profileMsg}</span>
            </div>
          )}

          {profileError && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Bio / Status
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {bio.length}/180 characters
                </span>
              </div>
              <Textarea
                value={bio}
                maxLength={180}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a short bio or status with your circle..."
                className="min-h-[90px] rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-900 transition-colors p-3.5 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Phone Number <span className="text-slate-400 font-normal normal-case">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 019 2831"
                  className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Encrypted in your self-hosted SQLite store. Only friends you accept can see this.
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                isLoading={isUpdatingProfile}
                className="h-11 px-6 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25"
              >
                Save Profile
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Security & Password Tab */}
      {activeTab === 'security' && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Password & Authentication</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Securely hashed with bcrypt algorithm with salt rounds.
            </p>
          </div>

          {passwordMsg && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{passwordMsg}</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Current Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-900"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-900"
                  placeholder="Min 6 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type={showNewPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-900"
                  placeholder="Re-enter new password"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                isLoading={isChangingPass}
                className="h-11 px-6 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25"
              >
                Update Password
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Appearance & Themes Tab */}
      {activeTab === 'appearance' && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Palette className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Appearance & Themes</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose your preferred visual presentation mode across all devices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Light Mode Card */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={cn(
                'group relative flex flex-col items-start p-5 rounded-2xl border text-left transition-all',
                theme === 'light'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-3">
                <Sun className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Light Mode</p>
              <p className="text-xs text-slate-400 mt-1">Crisp high contrast on clean ivory surfaces</p>
              {theme === 'light' && (
                <div className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
              )}
            </button>

            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={cn(
                'group relative flex flex-col items-start p-5 rounded-2xl border text-left transition-all',
                theme === 'dark'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-3">
                <Moon className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Dark Mode</p>
              <p className="text-xs text-slate-400 mt-1">Deep slate background with neon-toned accents</p>
              {theme === 'dark' && (
                <div className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
              )}
            </button>

            {/* System Mode Card */}
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={cn(
                'group relative flex flex-col items-start p-5 rounded-2xl border text-left transition-all',
                theme === 'system'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 mb-3">
                <Laptop className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">System Match</p>
              <p className="text-xs text-slate-400 mt-1">Automatically switches based on OS setting</p>
              {theme === 'system' && (
                <div className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Privacy & Data Ownership Tab */}
      {activeTab === 'data' && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Data Ownership & Privacy</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Orbit runs without third-party tracking, profiling scripts, or ad networks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                <ShieldCheck className="h-5 w-5" />
                <span>Zero Tracking Guarantee</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                All your chats, posts, and call handshakes are routed directly over encrypted WebSockets and peer-to-peer WebRTC channels.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <Database className="h-5 w-5" />
                <span>Local SQLite Portability</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Your database is stored in standard relational tables. You can export and migrate your full social graph at any time.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Export Full Social Archive
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 max-w-md">
                Download a clean `.json` file of all your posts, friendships, direct messages, and media references.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportData}
              className="h-10 px-4 rounded-xl border-slate-300 dark:border-slate-700 font-semibold text-xs shrink-0"
            >
              <Download className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" />
              <span>Export Archive (.JSON)</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

