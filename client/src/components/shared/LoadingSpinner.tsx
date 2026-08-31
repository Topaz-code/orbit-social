import React from 'react';
import { cn } from '../../lib/utils.js';
import { Loader2 } from 'lucide-react';

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
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <Loader2 className={cn('animate-spin text-[#D0A56A]', sizeClasses[size])} />
      {label && <p className="mt-3 text-sm text-[#A8AAA0]">{label}</p>}
    </div>
  );
};

