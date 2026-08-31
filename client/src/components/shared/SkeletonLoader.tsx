import React from 'react';
import { cn } from '../../lib/utils.js';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn('rounded-xl skeleton-shimmer bg-[#2B3940] border border-[#3A4B4D]/30', className)}
    />
  );
};

