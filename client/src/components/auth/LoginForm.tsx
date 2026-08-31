import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../ui/button.js';
import { Input } from '../ui/input.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card.js';
import { User, Lock, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { api } from '../../lib/api.js';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Username, email or phone is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(true),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data);
      navigate('/');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Invalid username or password');
    }
  };

  const handleFetchQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetIdentifier.trim()) return;
    setServerError(null);
    setIsSubmittingReset(true);
    try {
      const res = await api.get(`/auth/security-question?identifier=${encodeURIComponent(resetIdentifier.trim())}`);
      setSecurityQuestion(res.data?.data?.security_question || "What is your pet's name?");
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'User not found');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityAnswer || !newPassword) return;
    setServerError(null);
    setIsSubmittingReset(true);
    try {
      await api.post('/auth/reset-password', {
        identifier: resetIdentifier.trim(),
        security_answer: securityAnswer.trim(),
        new_password: newPassword,
      });
      setResetSuccessMsg('Password reset successfully! You can now log in.');
      setTimeout(() => {
        setIsResetMode(false);
        setSecurityQuestion(null);
        setResetSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-[#3A4B4D] bg-[#202A2D] text-[#D9D0B8]">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2B3940] p-2.5 border border-[#3A4B4D]">
          <img src="/orbit-logo.svg" alt="Orbit" className="h-full w-full" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-[#D9D0B8]">
          Welcome to Orbit
        </CardTitle>
        <CardDescription className="text-xs text-[#A8AAA0]">
          Break free from algorithms. Stay connected with friends.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {serverError && (
          <div className="mb-4 rounded-xl bg-[#B87568]/15 border border-[#B87568]/30 p-3 text-xs text-[#B87568] font-medium animate-fade-in">
            {serverError}
          </div>
        )}

        {resetSuccessMsg && (
          <div className="mb-4 rounded-xl bg-[#71877B]/15 border border-[#71877B]/30 p-3 text-xs text-[#71877B] font-medium animate-fade-in">
            {resetSuccessMsg}
          </div>
        )}

        {!isResetMode ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#A8AAA0] mb-1.5">
                Username, Email or Phone
              </label>
              <Input
                type="text"
                placeholder="Username or email"
                icon={<User className="h-4 w-4 text-[#7F8B86]" />}
                error={errors.identifier?.message}
                {...register('identifier')}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#A8AAA0]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="text-xs text-[#D0A56A] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4 text-[#7F8B86]" />}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded accent-[#D0A56A] bg-[#2B3940] border-[#3A4B4D]"
                  {...register('rememberMe')}
                />
                <span className="text-xs text-[#A8AAA0]">Remember me</span>
              </label>

              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Self-hosted
              </span>
            </div>

            <Button type="submit" className="w-full h-11" isLoading={isSubmitting}>
              <span>Log in to Orbit</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {!securityQuestion ? (
              <form onSubmit={handleFetchQuestion} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A8AAA0] mb-1.5">
                    Enter your Username or Email
                  </label>
                  <Input
                    type="text"
                    placeholder="Username or email"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    icon={<User className="h-4 w-4 text-[#7F8B86]" />}
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11" isLoading={isSubmittingReset}>
                  Continue to Security Question
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3 bg-[#2B3940] border border-[#3A4B4D] rounded-xl text-xs">
                  <p className="font-semibold text-[#A8AAA0] mb-1">
                    Security Question:
                  </p>
                  <p className="text-[#D0A56A] font-medium">
                    {securityQuestion}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A8AAA0] mb-1.5">
                    Your Answer
                  </label>
                  <Input
                    type="text"
                    placeholder="Your answer"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    icon={<KeyRound className="h-4 w-4 text-[#7F8B86]" />}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A8AAA0] mb-1.5">
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    icon={<Lock className="h-4 w-4 text-[#7F8B86]" />}
                    required
                  />
                </div>

                <Button type="submit" className="w-full h-11" isLoading={isSubmittingReset}>
                  Reset Password
                </Button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setIsResetMode(false);
                setSecurityQuestion(null);
              }}
              className="w-full text-center text-xs text-[#7F8B86] hover:text-[#D9D0B8] mt-2 transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}

      </CardContent>

      <CardFooter className="flex justify-center border-t border-[#3A4B4D] pt-4">
        <p className="text-xs text-[#A8AAA0]">
          Do not have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="font-bold text-[#D0A56A] hover:underline"
          >
            Create account
          </button>
        </p>
      </CardFooter>
    </Card>

  );
};
