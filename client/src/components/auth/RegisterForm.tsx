import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../ui/button.js';
import { Input } from '../ui/input.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card.js';
import { User, Mail, Phone, Lock, Sparkles, ArrowRight } from 'lucide-react';

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  display_name: z.string().min(1, 'Display name is required').max(50),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  security_question: z.string().default("What is your pet's name?"),
  security_answer: z.string().min(1, 'Security answer is required for account recovery'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      security_question: "What is your pet's name?",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await registerUser(data);
      navigate('/');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-slate-200/80 dark:border-slate-800 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 my-6">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 p-2.5 shadow-inner">
          <img src="/orbit-logo.svg" alt="Orbit" className="h-full w-full" />
        </div>
        <CardTitle className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Join Orbit
        </CardTitle>
        <CardDescription className="text-xs">
          A teen-first social network built on privacy, not engagement metrics.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {serverError && (
          <div className="mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 p-3 text-xs text-rose-600 dark:text-rose-400 font-medium animate-fade-in">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Display Name
            </label>
            <Input
              type="text"
              placeholder="Your name"
              icon={<Sparkles className="h-4 w-4" />}
              error={errors.display_name?.message}
              {...register('display_name')}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Username
            </label>
            <Input
              type="text"
              placeholder="Choose a username"
              icon={<User className="h-4 w-4" />}
              error={errors.username?.message}
              {...register('username')}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="jordan@example.com"
              icon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number (Optional)
            </label>
            <Input
              type="tel"
              placeholder="+1 555 019 283"
              icon={<Phone className="h-4 w-4" />}
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <Input
              type="password"
              placeholder="At least 6 characters"
              icon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Recovery Security Question:
            </p>
            <Input
              type="text"
              placeholder="Answer to: What is your pet's name?"
              error={errors.security_answer?.message}
              {...register('security_answer')}
            />
          </div>

          <Button type="submit" className="w-full h-11 mt-4" isLoading={isSubmitting}>
            <span>Create Orbit Account</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-slate-100 dark:border-slate-800 pt-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Log in
          </button>
        </p>
      </CardFooter>
    </Card>
  );
};
