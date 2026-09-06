import React from 'react';
import { cn } from '../../lib/utils.js';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  className,
}) => {
  const barHeights = {
    sm: 'h-4 w-1',
    md: 'h-6 w-1.5',
    lg: 'h-8 w-2',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-6 text-center select-none', className)}>
      <div className="flex items-center gap-1.5 py-2">
        <span
          className={cn(
            'bg-[#D0A56A] rounded-full animate-pulse shadow-xs',
            barHeights[size]
          )}
          style={{ animationDelay: '0ms', animationDuration: '900ms' }}
        />
        <span
          className={cn(
            'bg-[#E0B779] rounded-full animate-pulse shadow-xs',
            barHeights[size]
          )}
          style={{ animationDelay: '180ms', animationDuration: '900ms' }}
        />
        <span
          className={cn(
            'bg-[#71877B] rounded-full animate-pulse shadow-xs',
            barHeights[size]
          )}
          style={{ animationDelay: '360ms', animationDuration: '900ms' }}
        />
        <span
          className={cn(
            'bg-[#D0A56A] rounded-full animate-pulse shadow-xs',
            barHeights[size]
          )}
          style={{ animationDelay: '540ms', animationDuration: '900ms' }}
        />
      </div>
      {label && <p className="mt-3 text-xs font-medium text-[#A8AAA0] tracking-wide">{label}</p>}
    </div>
  );
};

