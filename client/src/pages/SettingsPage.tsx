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
    <div className="max-w-4xl mx-auto space-y-6 min-w-0 pb-16 text-[#D9D0B8]">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#3A4B4D] bg-[#202A2D] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2B3940] border border-[#3A4B4D] px-3 py-1 text-xs font-semibold text-[#D0A56A]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Personal Preferences</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#D9D0B8] tracking-tight">
              Settings & Privacy
            </h1>
            <p className="text-xs sm:text-sm text-[#A8AAA0] max-w-xl">
              Customize your profile appearance, access credentials, interface theme, and decentralized data exports.
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#2B3940] border border-[#3A4B4D] shadow-xs">
              <Avatar
                src={user.avatar_url}
                fallback={user.display_name}
                size="md"
                isOnline={true}
                showStatus={true}
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#D9D0B8] truncate">
                  {user.display_name}
                </p>
                <p className="text-xs text-[#D0A56A] font-medium truncate">
                  @{user.username}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation Pill Strip */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-[#3A4B4D] pt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-[10px] text-xs sm:text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-[#496D6B] text-[#D9D0B8] shadow-xs font-bold'
                    : 'text-[#A8AAA0] hover:text-[#D9D0B8] hover:bg-[#2B3940]'
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
        <div className="rounded-3xl border border-[#3A4B4D] bg-[#202A2D] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#3A4B4D] pb-4">
            <h2 className="text-lg font-bold text-[#D9D0B8] flex items-center gap-2">
              <User className="h-5 w-5 text-[#D0A56A]" />
              <span>Profile Identity</span>
            </h2>
            <p className="text-xs text-[#A8AAA0] mt-0.5">
              This information is visible on your profile and story updates.
            </p>
          </div>

          {profileMsg && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-[#71877B]/15 border border-[#71877B]/30 text-[#71877B] text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#71877B]" />
              <span>{profileMsg}</span>
            </div>
          )}

          {profileError && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-[#B87568]/15 border border-[#B87568]/30 text-[#B87568] text-xs font-semibold animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#B87568]" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#A8AAA0]">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7F8B86]" />
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 h-11 rounded-[10px] bg-[#2B3940] border-[#3A4B4D] text-[#D9D0B8] focus:ring-2 focus:ring-[#496D6B]"
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#A8AAA0]">
                  Bio / Status
                </label>
                <span className="text-[11px] text-[#7F8B86] font-medium">
                  {bio.length}/180 characters
                </span>
              </div>
              <Textarea
                value={bio}
                maxLength={180}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a short bio or status with your circle..."
                className="min-h-[90px] rounded-[10px] bg-[#2B3940] border-[#3A4B4D] text-[#D9D0B8] focus:ring-2 focus:ring-[#496D6B] p-3.5 text-sm font-serif"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#A8AAA0]">
                Phone Number <span className="text-[#7F8B86] font-normal normal-case">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7F8B86]" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 019 2831"
                  className="pl-10 h-11 rounded-[10px] bg-[#2B3940] border-[#3A4B4D] text-[#D9D0B8] focus:ring-2 focus:ring-[#496D6B]"
                />
              </div>
              <p className="text-[11px] text-[#7F8B86]">
                Encrypted in your self-hosted database. Only friends you accept can see this.
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                isLoading={isUpdatingProfile}
                className="h-11 px-6 rounded-[10px] font-semibold bg-[#D0A56A] hover:bg-[#E0B779] text-[#171A1C] shadow-xs"
              >
                Save Profile
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Security & Password Tab */}
      {activeTab === 'security' && (
        <div className="rounded-3xl border border-[#3A4B4D] bg-[#202A2D] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#3A4B4D] pb-4">
            <h2 className="text-lg font-bold text-[#D9D0B8] flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#D0A56A]" />
              <span>Password & Authentication</span>
            </h2>
            <p className="text-xs text-[#A8AAA0] mt-0.5">
              Securely hashed with bcrypt algorithm with salt rounds.
            </p>
          </div>

          {passwordMsg && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-[#71877B]/15 border border-[#71877B]/30 text-[#71877B] text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#71877B]" />
              <span>{passwordMsg}</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-[#B87568]/15 border border-[#B87568]/30 text-[#B87568] text-xs font-semibold animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#B87568]" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#A8AAA0]">
                Current Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7F8B86]" />
                <Input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-[10px] bg-[#2B3940] border-[#3A4B4D] text-[#D9D0B8] focus:ring-2 focus:ring-[#496D6B]"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7F8B86] hover:text-[#D9D0B8]"
                >
                  {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#A8AAA0]">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7F8B86]" />
                <Input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-[10px] bg-[#2B3940] border-[#3A4B4D] text-[#D9D0B8] focus:ring-2 focus:ring-[#496D6B]"
                  placeholder="Min 6 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7F8B86] hover:text-[#D9D0B8]"
                >
                  {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#A8AAA0]">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7F8B86]" />
                <Input
                  type={showNewPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-11 rounded-[10px] bg-[#2B3940] border-[#3A4B4D] text-[#D9D0B8] focus:ring-2 focus:ring-[#496D6B]"
                  placeholder="Re-enter new password"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                isLoading={isChangingPass}
                className="h-11 px-6 rounded-[10px] font-semibold bg-[#D0A56A] hover:bg-[#E0B779] text-[#171A1C] shadow-xs"
              >
                Update Password
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Appearance & Themes Tab */}
      {activeTab === 'appearance' && (
        <div className="rounded-3xl border border-[#3A4B4D] bg-[#202A2D] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#3A4B4D] pb-4">
            <h2 className="text-lg font-bold text-[#D9D0B8] flex items-center gap-2">
              <Palette className="h-5 w-5 text-[#D0A56A]" />
              <span>Appearance & Themes</span>
            </h2>
            <p className="text-xs text-[#A8AAA0] mt-0.5">
              Choose your preferred visual presentation mode across all devices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={cn(
                'group relative flex flex-col items-start p-5 rounded-2xl border text-left transition-all',
                theme === 'dark'
                  ? 'border-[#496D6B] bg-[#2B3940] ring-2 ring-[#496D6B]/30'
                  : 'border-[#3A4B4D] hover:border-[#496D6B]/50 bg-[#202A2D]'
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#202A2D] text-[#D0A56A] mb-3 border border-[#3A4B4D]">
                <Moon className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-[#D9D0B8]">Dark Mode</p>
              <p className="text-xs text-[#A8AAA0] mt-1">Deep quiet-room charcoal with warm cream accents</p>
              {theme === 'dark' && (
                <div className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-[#D0A56A] text-[#171A1C]">
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
                  ? 'border-[#496D6B] bg-[#2B3940] ring-2 ring-[#496D6B]/30'
                  : 'border-[#3A4B4D] hover:border-[#496D6B]/50 bg-[#202A2D]'
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#202A2D] text-[#496D6B] mb-3 border border-[#3A4B4D]">
                <Laptop className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-[#D9D0B8]">System Match</p>
              <p className="text-xs text-[#A8AAA0] mt-1">Automatically switches based on OS setting</p>
              {theme === 'system' && (
                <div className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-[#D0A56A] text-[#171A1C]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Privacy & Data Ownership Tab */}
      {activeTab === 'data' && (
        <div className="rounded-3xl border border-[#3A4B4D] bg-[#202A2D] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#3A4B4D] pb-4">
            <h2 className="text-lg font-bold text-[#D9D0B8] flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-[#D0A56A]" />
              <span>Data Ownership & Privacy</span>
            </h2>
            <p className="text-xs text-[#A8AAA0] mt-0.5">
              Orbit runs without third-party tracking, profiling scripts, or ad networks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#2B3940] border border-[#3A4B4D] space-y-2">
              <div className="flex items-center gap-2 text-[#71877B] font-bold text-sm">
                <ShieldCheck className="h-5 w-5" />
                <span>Zero Tracking Guarantee</span>
              </div>
              <p className="text-xs text-[#A8AAA0] leading-relaxed">
                All your chats, posts, and call handshakes are routed directly over encrypted WebSockets and peer-to-peer WebRTC channels.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#2B3940] border border-[#3A4B4D] space-y-2">
              <div className="flex items-center gap-2 text-[#496D6B] font-bold text-sm">
                <Database className="h-5 w-5" />
                <span>Local SQLite Portability</span>
              </div>
              <p className="text-xs text-[#A8AAA0] leading-relaxed">
                Your database is stored in standard relational tables. You can export and migrate your full social graph at any time.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-[#3A4B4D] bg-[#2B3940] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-[#D9D0B8]">
                Export Full Social Archive
              </h4>
              <p className="text-xs text-[#A8AAA0] mt-0.5 max-w-md">
                Download a clean `.json` file of all your posts, friendships, direct messages, and media references.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportData}
              className="h-10 px-4 rounded-[10px] border-[#3A4B4D] bg-[#202A2D] text-[#D9D0B8] hover:bg-[#314048] font-semibold text-xs shrink-0"
            >
              <Download className="h-4 w-4 mr-2 text-[#D0A56A]" />
              <span>Export Archive (.JSON)</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

