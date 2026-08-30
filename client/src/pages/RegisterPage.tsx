import React from 'react';
import { RegisterForm } from '../components/auth/RegisterForm.js';

export const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      <RegisterForm />
    </div>
  );
};
