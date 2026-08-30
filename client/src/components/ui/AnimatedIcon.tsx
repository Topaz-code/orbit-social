import React, { useState } from 'react';
import { cn } from '../../lib/utils.js';

// Icons8 popular animated icon styles and vectors
export type AnimatedIconName =
  | 'home'
  | 'compass'
  | 'chat'
  | 'users'
  | 'flame'
  | 'bell'
  | 'phone'
  | 'user'
  | 'settings'
  | 'heart'
  | 'sparkles'
  | 'rocket'
  | 'lock'
  | 'globe';

interface AnimatedIconProps {
  name: AnimatedIconName;
  className?: string;
  size?: number;
  trigger?: 'hover' | 'loop' | 'click';
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  name,
  className,
  size = 22,
  trigger = 'hover',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getIconContent = () => {
    switch (name) {
      case 'home':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'transition-transform duration-300',
              isHovered && 'scale-110 -translate-y-0.5'
            )}
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline
              points="9 22 9 12 15 12 15 22"
              className={cn('transition-all duration-300', isHovered ? 'stroke-indigo-500' : '')}
            />
          </svg>
        );

      case 'compass':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'transition-transform duration-500',
              isHovered && 'rotate-90 scale-110'
            )}
          >
            <circle cx="12" cy="12" r="10" />
            <polygon
              points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
              className={cn(
                'transition-all duration-300 fill-current',
                isHovered ? 'text-indigo-500' : 'text-transparent'
              )}
            />
          </svg>
        );

      case 'chat':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'transition-transform duration-300',
              isHovered && 'scale-115 rotate-3'
            )}
          >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            <line
              x1="8"
              y1="10"
              x2="16"
              y2="10"
              className={cn('transition-all duration-300', isHovered && 'stroke-indigo-500')}
            />
            <line
              x1="8"
              y1="14"
              x2="12"
              y2="14"
              className={cn('transition-all duration-300', isHovered && 'stroke-indigo-500')}
            />
          </svg>
        );

      case 'users':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'transition-transform duration-300',
              isHovered && 'scale-110'
            )}
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle
              cx="9"
              cy="7"
              r="4"
              className={cn('transition-all duration-300', isHovered && 'stroke-indigo-500')}
            />
            <path
              d="M22 21v-2a4 4 0 0 0-3-3.87"
              className={cn('transition-all duration-300', isHovered && 'translate-x-0.5')}
            />
            <path
              d="M16 3.13a4 4 0 0 1 0 7.75"
              className={cn('transition-all duration-300', isHovered && 'translate-x-0.5')}
            />
          </svg>
        );

      case 'flame':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={isHovered ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'transition-all duration-300 text-amber-500',
              isHovered && 'scale-120 animate-bounce'
            )}
          >
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
        );

      case 'bell':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'transition-transform duration-300 origin-top',
              isHovered && 'animate-wiggle text-indigo-500'
            )}
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        );

      case 'phone':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'transition-transform duration-300 origin-center',
              isHovered && 'animate-wiggle text-emerald-500 scale-110'
            )}
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        );

      case 'user':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'transition-transform duration-300',
              isHovered && 'scale-115'
            )}
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle
              cx="12"
              cy="7"
              r="4"
              className={cn('transition-all duration-300', isHovered && 'stroke-indigo-500 fill-indigo-500/20')}
            />
          </svg>
        );

      case 'settings':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'transition-transform duration-700',
              isHovered && 'rotate-180 text-indigo-500 scale-110'
            )}
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        );

      case 'heart':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={isHovered ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'transition-all duration-300 text-rose-500',
              isHovered && 'scale-125 animate-heart-burst'
            )}
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <span
      className={cn('inline-flex items-center justify-center select-none cursor-pointer', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {getIconContent()}
    </span>
  );
};
