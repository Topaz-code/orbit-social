import * as React from 'react';
import { cn } from '../../lib/utils.js';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-11 w-full rounded-[10px] border border-[#3A4B4D] bg-[#2B3940] px-4 py-2 text-sm text-[#D9D0B8] placeholder:text-[#7F8B86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#496D6B] focus-visible:border-transparent transition-all disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pl-10',
            error && 'border-[#B87568] focus-visible:ring-[#B87568]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-[#B87568] font-medium">{error}</p>}

      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
