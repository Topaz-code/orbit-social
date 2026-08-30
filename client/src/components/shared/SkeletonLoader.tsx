import React from 'react';
import { cn } from '../../lib/utils.js';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn('rounded-xl skeleton-shimmer bg-slate-200 dark:bg-slate-800', className)}
    />
  );
};
