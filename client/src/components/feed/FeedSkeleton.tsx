import React from 'react';
import { Skeleton } from '../shared/SkeletonLoader.js';

export const FeedSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-[#3A4B4D] bg-[#202A2D] p-5 shadow-xs"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>

          {/* Content lines */}
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* Media box */}
          {i % 2 === 1 && <Skeleton className="h-64 w-full rounded-2xl mb-4" />}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#3A4B4D]">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

