import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, showPasswordToggle, ...props }, ref) => {
    const isPasswordType = type === 'password';
    const enableToggle = showPasswordToggle !== undefined ? showPasswordToggle : isPasswordType;
    const [showPassword, setShowPassword] = React.useState(false);

    const inputType = enableToggle && isPasswordType
      ? (showPassword ? 'text' : 'password')
      : type;

    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={inputType}
          className={cn(
            'flex h-11 w-full rounded-[10px] border border-[#3A4B4D] bg-[#2B3940] px-4 py-2 text-sm text-[#D9D0B8] placeholder:text-[#7F8B86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#496D6B] focus-visible:border-transparent transition-[border-color,box-shadow] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pl-10',
            enableToggle && 'pr-10',
            error && 'border-[#B87568] focus-visible:ring-[#B87568]',
            className
          )}
          ref={ref}
          {...props}
        />
        {enableToggle && isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#D9D0B8] p-1 rounded transition-colors focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
        {error && <p className="mt-1.5 text-xs text-[#B87568] font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };

