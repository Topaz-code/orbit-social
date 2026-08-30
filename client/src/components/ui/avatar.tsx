import * as React from 'react';
import { cn, getMediaUrl } from '../../lib/utils.js';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  showStatus?: boolean;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base font-semibold',
  xl: 'h-24 w-24 text-2xl font-bold',
};

const onlineIndicatorSizes = {
  xs: 'h-1.5 w-1.5 ring-1',
  sm: 'h-2.5 w-2.5 ring-1.5',
  md: 'h-3 w-3 ring-2',
  lg: 'h-3.5 w-3.5 ring-2',
  xl: 'h-5 w-5 ring-4',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  fallback = '?',
  size = 'md',
  isOnline,
  showStatus = false,
  className,
  ...props
}) => {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [src]);

  const fallbackLetter = (fallback || alt || 'O').slice(0, 2).toUpperCase();

  const resolvedSrc = getMediaUrl(src);

  return (
    <div className={cn('relative inline-flex flex-shrink-0 select-none', className)} {...props}>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-medium',
          sizeClasses[size]
        )}
      >
        {resolvedSrc && !imageError ? (
          <img
            src={resolvedSrc}
            alt={alt}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{fallbackLetter}</span>
        )}
      </div>

      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-white dark:ring-slate-900',
            onlineIndicatorSizes[size],
            isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
          )}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
