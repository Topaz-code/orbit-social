import React from 'react';
import { cn } from '../../lib/utils.js';
import { Button } from '../ui/button.js';

import { AnimatedIcon } from '../ui/AnimatedIcon.js';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-[#3A4B4D] bg-[#202A2D] animate-fade-in my-4',
        className
      )}
    >
      {icon ? (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2B3940] border border-[#3A4B4D] text-[#D0A56A] mb-4">
          {icon}
        </div>
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2B3940] border border-[#3A4B4D] mb-4">
          <AnimatedIcon name="sparkles" size={26} className="text-[#D0A56A]" />
        </div>
      )}
      <h3 className="text-lg font-bold text-[#D9D0B8] mb-1">{title}</h3>
      <p className="max-w-sm text-sm text-[#A8AAA0] mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="bg-[#D0A56A] text-[#171A1C] hover:bg-[#E0B779] font-semibold rounded-[10px]">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

