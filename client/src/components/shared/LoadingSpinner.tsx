import React from 'react';
import { cn } from '../../lib/utils.js';
import { Skeleton } from './SkeletonLoader.js';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

/**
 * Skeleton-based placeholder loader matching Orbit's warm dark theme.
 * Completely replaces all circular spinners and pulsing bars with genuine shimmer wireframes.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  className,
}) => {
  if (size === 'sm') {
    return (
      <div className={cn('flex items-center gap-2 p-2 w-full max-w-xs', className)}>
        <Skeleton className="h-6 w-6 rounded-full shrink-0" />
        <div className="space-y-1 flex-1">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2 w-1/2" />
        </div>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className={cn('w-full max-w-md p-6 rounded-2xl border border-[#3A4B4D]/50 bg-[#202A2D]/80 backdrop-blur-sm shadow-sm space-y-4 select-none', className)}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="space-y-2 pt-1">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
        {label && (
          <p className="pt-2 text-center text-xs font-medium text-[#A8AAA0] tracking-wide animate-pulse">
            {label}
          </p>
        )}
      </div>
    );
  }

  // Default 'md'
  return (
    <div className={cn('w-full max-w-sm p-4 rounded-xl border border-[#3A4B4D]/40 bg-[#202A2D]/60 shadow-xs space-y-3 select-none', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="space-y-1 flex-1">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      {label && (
        <p className="text-center text-xs font-medium text-[#A8AAA0] tracking-wide pt-1 animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
};

export { Skeleton };
